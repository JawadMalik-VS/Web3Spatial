let poseMesh;
let video;
const statusElement = document.getElementById('status');

function updateStatus(message) {
    statusElement.textContent = message;
}

async function setupCamera() {
    try {
        updateStatus('Requesting camera access...');
        video = document.getElementById('video');
        const stream = await navigator.mediaDevices.getUserMedia({
            'video': {
                width: 640,
                height: 480
            }
        });
        video.srcObject = stream;
        
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                updateStatus('Camera initialized');
                video.play();
                resolve(video);
            };
        });
    } catch (error) {
        updateStatus('Error accessing camera: ' + error.message);
        console.error('Error accessing camera:', error);
        throw error;
    }
}

async function init() {
    try {
        // Setup camera
        updateStatus('Initializing...');
        await setupCamera();
        
        // Initialize PoseMesh
        updateStatus('Setting up PoseMesh...');
        poseMesh = new PoseMesh();
        await poseMesh.initialize();

        updateStatus('System ready');
        // Start animation loop
        animate();
    } catch (error) {
        updateStatus('Error during initialization: ' + error.message);
        console.error('Initialization error:', error);
    }
}

async function animate() {
    requestAnimationFrame(animate);
    
    try {
        // Detect poses
        const poses = await poseMesh.detectPose(video);
        
        // Update meshes based on poses
        if (poses && poses.length > 0) {
            poseMesh.updateMeshes(poses);
            updateStatus('Detecting poses - Found: ' + poses.length);
        } else {
            updateStatus('No poses detected');
        }
        
        // Render scene
        poseMesh.render();
    } catch (error) {
        updateStatus('Error in animation loop: ' + error.message);
        console.error('Animation error:', error);
    }
}

// Start the application
init(); 