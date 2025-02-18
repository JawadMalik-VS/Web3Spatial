class PoseMesh {
    constructor() {
        this.detector = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.meshes = [];
        this.gestureRecognizer = new GestureRecognizer();
        this.interactiveObjects = null;
        this.web3Integration = new Web3Integration();
        this.connectedPeers = new Map();
    }

    async initialize() {
        // Initialize pose detector
        const model = poseDetection.SupportedModels.BlazePose;
        const detectorConfig = {
            runtime: 'tfjs',
            modelType: 'full'
        };
        this.detector = await poseDetection.createDetector(model, detectorConfig);

        // Initialize Three.js scene
        this.setupScene();
        
        // Initialize interactive objects after scene setup
        this.interactiveObjects = new InteractiveObjects(this.scene);
        
        // Add some interactive objects
        this.interactiveObjects.createInteractiveBox([0, 0, 0]);
        this.interactiveObjects.createInteractionZone([0.5, 0.5, 0]);
        
        // Initialize Web3
        try {
            await this.web3Integration.initialize();
        } catch (error) {
            console.warn('Web3 initialization failed:', error);
        }
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2a2a2a); // Dark grey background
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('container').appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 1, 0);
        this.scene.add(directionalLight);

        this.camera.position.z = 2; // Moved camera closer
        
        // Add a grid helper for better orientation
        const gridHelper = new THREE.GridHelper(10, 10);
        gridHelper.rotation.x = Math.PI / 2;
        this.scene.add(gridHelper);
    }

    async detectPose(video) {
        const poses = await this.detector.estimatePoses(video);
        return poses;
    }

    updateMeshes(poses) {
        // Clear existing meshes
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.meshes = [];

        poses.forEach(pose => {
            pose.keypoints3D.forEach(point => {
                const geometry = new THREE.SphereGeometry(0.03, 32, 32); // Smaller spheres
                const material = new THREE.MeshPhongMaterial({ 
                    color: 0x00ff00,
                    emissive: 0x00ff00,
                    emissiveIntensity: 0.2
                });
                const mesh = new THREE.Mesh(geometry, material);
                
                // Scale the positions to be more visible
                mesh.position.set(point.x * 0.5, point.y * 0.5, point.z * 0.5);
                this.scene.add(mesh);
                this.meshes.push(mesh);
            });

            // Detect gestures
            const detectedGestures = this.gestureRecognizer.detectGestures(pose);
            
            if (detectedGestures.length > 0) {
                this.handleGestureDetected(detectedGestures[0], pose);
            }

            // Check for interactions with objects
            this.interactiveObjects.checkInteractions(pose);
        });

        // Update interactive objects animations
        this.interactiveObjects.update();
    }

    async handleGestureDetected(gestureName, pose) {
        // Create visual feedback
        this.createGestureFeedback(pose);

        // Save gesture as NFT if Web3 is initialized
        if (this.web3Integration.initialized) {
            try {
                await this.web3Integration.saveGestureNFT({
                    name: gestureName,
                    score: 1.0
                });
            } catch (error) {
                console.error('Failed to save gesture as NFT:', error);
            }
        }

        // Broadcast gesture to other peers
        this.broadcastGesture(gestureName, pose);
    }

    createGestureFeedback(pose) {
        const geometry = new THREE.SphereGeometry(0.1, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        
        const feedback = new THREE.Mesh(geometry, material);
        feedback.position.set(pose.keypoints[0].x, pose.keypoints[0].y, pose.keypoints[0].z);
        
        this.scene.add(feedback);

        // Animate and remove
        new TWEEN.Tween(feedback.scale)
            .to({ x: 2, y: 2, z: 2 }, 500)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();

        new TWEEN.Tween(feedback.material)
            .to({ opacity: 0 }, 500)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
                this.scene.remove(feedback);
            })
            .start();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
} 