require('dotenv').config(); // Include dotenv at the beginning
const express = require('express');
const StellarSdk = require('stellar-sdk');
const axios = require('axios');
const cors = require('cors');

// A simple array to store projects
let projects = [];

let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://horizon-testnet.stellar.org/accounts/:GBHPAIAIMWXQLVY4YGXDQK43S3YJLHXG7UDGR3TIG37BZYIP3H32YUUJ',
    headers: { 
      'Accept': 'application/json'
    }
};
  
axios.request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data));
  })
  .catch((error) => {
    console.log(error);
  });

const app = express();
const port = 3000;
const destinationId = process.env.DESTINATION_ACCOUNT_ID; // Get the destination account ID from .env
app.use(cors());
// Connect to the Testnet
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

app.use(express.json());

// Create a project
app.post('/projects', (req, res) => {
    const { title, description, goalAmount, endDate } = req.body;

    // Create a new project and add it to the array
    const newProject = {
        id: projects.length + 1, // Automatic ID assignment
        title,
        description,
        goalAmount,
        endDate,
        fundsRaised: 0, // Initial funds raised is 0
    };
    projects.push(newProject); // Add project to the array
    console.log(newProject);

    // Send response
    res.status(201).json(newProject);
});

// List all projects
app.get('/projects', (req, res) => {
    res.json(projects); // Return projects in JSON format
});

const rewardTiers = [
    { amount: 10, reward: 'Special Thank You Letter' },
    { amount: 50, reward: 'Exclusive Event Invitation' },
    { amount: 100, reward: 'Your Name Will Appear on the Project Page' }
];

// Fund a project
app.post('/projects/:projectId/fund', async (req, res) => {
    const { amount } = req.body; // Get the amount from user input
    const projectId = parseInt(req.params.projectId, 10); // Get the project ID from the URL
    const project = projects.find(p => p.id === projectId); // Find the project with the corresponding ID

    // If project not found, return a 404 error
    if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
    }

    const currentDate = new Date();

    // Check if the campaign is expired
    if (currentDate > new Date(project.endDate)) {
        return res.status(400).json({ error: 'This campaign has ended.' });
    }

    const sourceKeypair = StellarSdk.Keypair.fromSecret(process.env.SECRET_KEY); // Get the secret key from .env

    try {
        // Load the user's Stellar account
        const account = await server.loadAccount(sourceKeypair.publicKey());

        // Check if the destination account exists
        try {
            await server.loadAccount(destinationId); // Check destination account
        } catch (error) {
            console.error('Destination account not found:', error);
            return res.status(404).json({ error: 'Destination account not found.' });
        }

        // Add the fund amount
        project.fundsRaised += parseFloat(amount);

        // Check if the goal amount has been reached
        console.log(`Total funds raised: ${project.fundsRaised}, Goal amount: ${project.goalAmount}`);

        // Check for reward tiers
        const userRewards = rewardTiers.filter(tier => project.fundsRaised >= tier.amount);
        if (userRewards.length > 0) {
            const latestReward = userRewards[userRewards.length - 1]; // Highest reward level
            return res.status(200).json({
                message: `Fund successfully sent! Reward for user: ${latestReward.reward}`,
                project
            });
        }

        // If goal amount is reached, transfer funds
        if (project.fundsRaised >= project.goalAmount) {
            console.log(`Goal amount reached! (${project.fundsRaised} >= ${project.goalAmount})`);

            // Create the payment transaction
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: StellarSdk.Networks.TESTNET // Use Testnet for this
            })
            .addOperation(StellarSdk.Operation.payment({
                destination: destinationId, // Destination account
                asset: StellarSdk.Asset.native(), // Default XLM (Stellar Lumen) asset
                amount: project.fundsRaised.toString(), // Total amount as string
            }))
            .setTimeout(120) // 120-second timeout
            .build();

            // Sign and submit the transaction
            transaction.sign(sourceKeypair);
            const result = await server.submitTransaction(transaction);

            console.log('Transaction successful:', result);

            // Return success response
            return res.status(200).json({
                message: 'Goal successfully achieved and funds transferred!',
                project
            });
        }

        // If goal not reached, just accept the donation
        res.status(200).json({
            message: 'Funds successfully sent!',
            project
        });

    } catch (error) {
        console.error('Transaction failed:', error);
        res.status(500).json({ error: 'Failed to send funds.', details: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
