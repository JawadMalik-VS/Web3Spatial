class InteractiveObjects {
    constructor(scene) {
        this.scene = scene;
        this.objects = new Map();
        this.interactionZones = new Map();
    }

    createInteractiveBox(position, color = 0x00ff00) {
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const box = new THREE.Mesh(geometry, material);
        box.position.set(...position);
        
        this.objects.set(box.id, {
            mesh: box,
            type: 'interactive',
            originalColor: color,
            isHighlighted: false
        });

        this.scene.add(box);
        return box;
    }

    createInteractionZone(position, radius = 0.3) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.2
        });
        const zone = new THREE.Mesh(geometry, material);
        zone.position.set(...position);
        
        this.interactionZones.set(zone.id, {
            mesh: zone,
            radius: radius,
            isActive: false
        });

        this.scene.add(zone);
        return zone;
    }

    checkInteractions(pose) {
        const rightHand = pose.keypoints.find(kp => kp.name === 'right_wrist');
        if (!rightHand) return;

        this.interactionZones.forEach((zone, id) => {
            const distance = this.calculateDistance(
                new THREE.Vector3(rightHand.x, rightHand.y, rightHand.z),
                zone.mesh.position
            );

            if (distance < zone.radius) {
                this.triggerInteraction(id);
            }
        });
    }

    triggerInteraction(zoneId) {
        const zone = this.interactionZones.get(zoneId);
        if (!zone) return;

        zone.isActive = true;
        zone.mesh.material.opacity = 0.4;
        
        // Trigger animation or effect
        this.animateNearbyObjects(zone.mesh.position);
    }

    animateNearbyObjects(position) {
        this.objects.forEach((obj) => {
            const distance = this.calculateDistance(position, obj.mesh.position);
            if (distance < 1) {
                this.animateObject(obj);
            }
        });
    }

    animateObject(obj) {
        if (obj.isAnimating) return;
        obj.isAnimating = true;

        const originalScale = obj.mesh.scale.clone();
        const targetScale = originalScale.multiplyScalar(1.5);

        new TWEEN.Tween(obj.mesh.scale)
            .to(targetScale, 200)
            .easing(TWEEN.Easing.Quadratic.Out)
            .yoyo(true)
            .repeat(1)
            .onComplete(() => {
                obj.isAnimating = false;
            })
            .start();
    }

    calculateDistance(pos1, pos2) {
        return pos1.distanceTo(pos2);
    }

    update() {
        TWEEN.update();
    }
} 