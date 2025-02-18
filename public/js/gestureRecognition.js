class GestureRecognizer {
    constructor() {
        this.gestures = {
            'raised_hands': this.detectRaisedHands,
            'squat': this.detectSquat,
            't_pose': this.detectTPose,
            'wave': this.detectWave
        };
        this.lastGesture = null;
        this.gestureHistory = [];
    }

    detectGestures(pose) {
        const detectedGestures = [];
        
        for (const [gestureName, detectFn] of Object.entries(this.gestures)) {
            if (detectFn.call(this, pose)) {
                detectedGestures.push(gestureName);
            }
        }

        if (detectedGestures.length > 0) {
            this.lastGesture = detectedGestures[0];
            this.gestureHistory.push({
                gesture: detectedGestures[0],
                timestamp: Date.now()
            });
        }

        return detectedGestures;
    }

    detectRaisedHands(pose) {
        const leftWrist = pose.keypoints.find(kp => kp.name === 'left_wrist');
        const rightWrist = pose.keypoints.find(kp => kp.name === 'right_wrist');
        const nose = pose.keypoints.find(kp => kp.name === 'nose');

        return leftWrist && rightWrist && nose &&
               leftWrist.y < nose.y && rightWrist.y < nose.y;
    }

    detectSquat(pose) {
        const leftKnee = pose.keypoints.find(kp => kp.name === 'left_knee');
        const rightKnee = pose.keypoints.find(kp => kp.name === 'right_knee');
        const leftHip = pose.keypoints.find(kp => kp.name === 'left_hip');

        return leftKnee && rightKnee && leftHip &&
               Math.abs(leftKnee.y - leftHip.y) < 0.2;
    }

    detectTPose(pose) {
        const leftWrist = pose.keypoints.find(kp => kp.name === 'left_wrist');
        const rightWrist = pose.keypoints.find(kp => kp.name === 'right_wrist');
        const leftShoulder = pose.keypoints.find(kp => kp.name === 'left_shoulder');
        const rightShoulder = pose.keypoints.find(kp => kp.name === 'right_shoulder');

        return leftWrist && rightWrist && leftShoulder && rightShoulder &&
               Math.abs(leftWrist.y - rightWrist.y) < 0.1 &&
               Math.abs(leftShoulder.y - rightShoulder.y) < 0.1;
    }

    detectWave(pose) {
        const wrist = pose.keypoints.find(kp => kp.name === 'right_wrist');
        if (!wrist || !this.gestureHistory.length) return false;

        const recentHistory = this.gestureHistory
            .slice(-10)
            .filter(h => h.timestamp > Date.now() - 1000);
        
        const wristMovement = recentHistory
            .map(h => h.wristY)
            .reduce((acc, y) => Math.abs(y - wrist.y) + acc, 0);

        return wristMovement > 0.5;
    }
} 