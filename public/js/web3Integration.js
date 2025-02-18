class Web3Integration {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        this.initialized = false;
    }

    async initialize() {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('Please install MetaMask to use Web3 features');
        }

        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            this.web3 = new Web3(window.ethereum);
            this.account = (await this.web3.eth.getAccounts())[0];
            
            // Initialize smart contract
            this.contract = new this.web3.eth.Contract(
                this.getABI(),
                this.getContractAddress()
            );

            this.initialized = true;
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                this.account = accounts[0];
            });

        } catch (error) {
            console.error('Web3 initialization failed:', error);
            throw error;
        }
    }

    async saveGestureNFT(gestureData) {
        if (!this.initialized) throw new Error('Web3 not initialized');

        const metadata = {
            gesture: gestureData.name,
            timestamp: Date.now(),
            score: gestureData.score
        };

        // Upload to IPFS (you'll need to implement this)
        const ipfsHash = await this.uploadToIPFS(metadata);

        // Mint NFT
        return await this.contract.methods
            .mintGestureNFT(ipfsHash)
            .send({ from: this.account });
    }

    async getGestureHistory() {
        if (!this.initialized) throw new Error('Web3 not initialized');

        return await this.contract.methods
            .getGestureHistory(this.account)
            .call();
    }

    getABI() {
        return [
            // Add your contract ABI here
        ];
    }

    getContractAddress() {
        return '0x...'; // Your contract address
    }
} 