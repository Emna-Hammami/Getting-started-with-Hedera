const {Client, 
    PrivateKey, 
    AccountCreateTransaction, 
    AccountBalanceQuery, 
    Hbar,
    TransferTransaction } = require ("@hashgraph/sdk");
    require ('dotenv').config();

async function environmentSetup() {
    //Grab your Hedera testnet account ID and private key from your .env file
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    //if we weren't able to grab it, we should throw a new error
    if (!myAccountId || !myPrivateKey) {
        throw new Error("Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present");
    }

//create your Hedera Testnet client
const client = Client.forTestnet();

//set your account as the client's operator
client.setOperator(myAccountId, myPrivateKey);

//or simply:
//const client = Client.forTestnet().setOperator(myAccountId, myPrivateKey);


//Generate a private and public key to associate with the account you will create.
//create new keys
const newAccountPrivateKey = PrivateKey.generateED25519();
const newAccountPublicKey = newAccountPrivateKey.publicKey;


/*Create a new account using AccountCreateTransaction(). Use the public key created in the previous step to enter in the setKey() field. 
This will associate the key pair generated in the previous step with the new account. */
//create a new account with 1,000 tinybar starting balance
const newAccount = await new AccountCreateTransaction()
                .setKey(newAccountPublicKey)
                .setInitialBalance(Hbar.fromTinybars(1000))
                .execute(client);


/*The account ID for the new account is returned in the receipt of the transaction that created the account. 
The receipt provides information about the transaction like whether it was successful or not and any new entity IDs that were created. */
//Get the new account ID
const getReceipt = await newAccount.getReceipt(client);
const newAccountId = getReceipt.accountId;
console.log("The new account ID is: "+ newAccountId); //Log the account ID


//submit a query to the Hedera test network to return the balance of the new account using the new account ID.
//verify the account balance
const accountBalance = await new AccountBalanceQuery()
                .setAccountId(newAccountId)
                .execute(client);
console.log("The new account balance is: " + accountBalance.hbars.toTinybars() + " tinybar.");


/*The account sending the HBAR needs to sign the transaction using its private keys to authorize the transfer.
Since you are transferring from the account associated with the client, you do not need to explicitly sign the transaction as the operator account(account transferring the HBAR) 
signs all transactions to authorize the payment of the transaction fee.*/
//Create the transfer transaction
const sendHbar = await new TransferTransaction()
            .addHbarTransfer(myAccountId, Hbar.fromTinybars(-1000)) //sending account
            .addHbarTransfer(newAccountId, Hbar.fromTinybars(1000)) //receiving account
            .execute(client);

//verify the transaction reached consensus
const transactionReceipt = await sendHbar.getReceipt(client);
console.log("The transfer transaction from my account to the new account was: "
                + transactionReceipt.status.toString()); //The receipt status will let you know if the transaction was successful (reached consensus) or not.

//request the cost of the query
const queryCost = await new AccountBalanceQuery()
                .setAccountId(newAccountId)
                .getCost(client);
console.log("The cost of query is: "+queryCost);
//check the new account's balance
const getNewBalance = await new  AccountBalanceQuery()
                .setAccountId(newAccountId)
                .execute(client);
console.log("The account balance after the transfer is: "+getNewBalance.hbars.toTinybars()+" tinybar.");
}
environmentSetup();