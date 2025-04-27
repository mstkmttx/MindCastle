/**
 * Mind Castle - Enhanced Particle Background Animation
 * Lightweight implementation using Canvas API
 */

class ParticleBackground {
    constructor(elementId = 'particles') {
        this.canvas = document.getElementById(elementId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 200; // Increased number of particles
        this.colors = [
            'rgba(127, 90, 240, 0.7)',  // Primary accent - purple
            'rgba(114, 240, 236, 0.7)',  // Secondary accent - teal
            'rgba(255, 255, 255, 0.9)'   // White for brighter stars
        ];
        this.maxSize = 3.5; // Slightly larger max size
        this.maxSpeed = 0.15; // Slightly faster movement
        this.isRunning = false;
        this.lastShootingStarTime = 0;
        this.shootingStarInterval = Math.random() * 15000 + 30000; // More frequent shooting stars (30-45s)
        this.shootingStar = null;

        // Initialize the canvas and setup
        this.initialize();
    }

    initialize() {
        // Set canvas size to fill the parent element
        this.resize();
        
        // Create particles
        this.createParticles();
        
        // Setup event listeners
        window.addEventListener('resize', () => this.resize());
        
        // Start animation
        this.animate();
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.width = parent.offsetWidth;
        this.height = parent.offsetHeight;
        
        // Set the canvas dimensions to match the display size
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Re-create particles when resized for optimal placement
        if (this.isRunning) {
            this.createParticles();
        }
    }

    createParticles() {
        this.particles = [];
        
        // Determine particle count based on screen size
        const adjustedCount = Math.min(this.particleCount, Math.floor(this.width * this.height / 4500));
        
        for (let i = 0; i < adjustedCount; i++) {
            // Create particles with different sizes for parallax effect
            const layer = Math.random() > 0.8 ? 'front' : (Math.random() > 0.5 ? 'middle' : 'back');
            const sizeMultiplier = layer === 'front' ? 1 : (layer === 'middle' ? 0.7 : 0.5);
            const speedMultiplier = layer === 'front' ? 1 : (layer === 'middle' ? 0.7 : 0.3);
            const size = (Math.random() * this.maxSize + 0.8) * sizeMultiplier;
            
            // Random positions
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            
            // Very low random velocities for subtle movement with parallax effect
            const vx = (Math.random() - 0.5) * this.maxSpeed * speedMultiplier;
            const vy = (Math.random() - 0.5) * this.maxSpeed * speedMultiplier;
            
            // Random color
            let color;
            if (layer === 'back') {
                // Higher chance of white for back layer stars
                color = Math.random() > 0.5 ? this.colors[2] : this.colors[Math.floor(Math.random() * 2)];
            } else if (layer === 'middle') {
                color = Math.random() > 0.6 ? this.colors[2] : this.colors[Math.floor(Math.random() * 2)];
            } else {
                // Front layer stars are more colorful
                color = this.colors[Math.floor(Math.random() * this.colors.length)];
            }
            
            // Random opacity for depth effect
            const opacity = layer === 'front' ? (Math.random() * 0.4 + 0.6) : 
                          (layer === 'middle' ? (Math.random() * 0.3 + 0.4) : (Math.random() * 0.2 + 0.3));
            
            // Twinkling speed based on layer - front twinkles more
            const twinkleSpeed = layer === 'front' ? (Math.random() * 0.03 + 0.02) : 
                              (layer === 'middle' ? (Math.random() * 0.02 + 0.01) : (Math.random() * 0.01 + 0.005));
            
            // Random start angle for twinkling
            const angle = Math.random() * Math.PI * 2;
            
            this.particles.push({
                x, y, vx, vy, size, color, opacity,
                originalSize: size,
                layer,
                pulse: twinkleSpeed,
                angle,
                // Randomly assign different twinkle patterns
                twinkleType: Math.floor(Math.random() * 3)
            });
        }
    }

    createShootingStar() {
        // Only create if enough time has passed since the last one
        const now = Date.now();
        if (now - this.lastShootingStarTime < this.shootingStarInterval) return;
        
        // Create a shooting star at a random position on the top quarter of the screen
        const startX = Math.random() * this.width;
        const startY = Math.random() * (this.height / 4); 
        
        // Random length between 100-200px
        const length = Math.random() * 100 + 100;
        
        // Angle between 30-150 degrees (downward trajectory)
        const angle = (Math.PI / 6) + (Math.random() * Math.PI * 2/3);
        
        // Random speed
        const speed = Math.random() * 3 + 5;
        
        this.shootingStar = {
            x: startX,
            y: startY,
            length: length,
            angle: angle,
            speed: speed,
            opacity: 0,
            fadeIn: true,
            trail: [],
            // Add a glowing head
            headSize: Math.random() * 3 + 2,
            // Add some sparkles
            sparkles: [],
            // Random color (white, cyan, or slight lavender)
            color: Math.random() > 0.7 ? 'rgba(255, 255, 255, 0.9)' : 
                   (Math.random() > 0.5 ? 'rgba(114, 240, 236, 0.9)' : 'rgba(200, 180, 255, 0.9)')
        };
        
        this.lastShootingStarTime = now;
        
        // Set next interval - between 45-60 seconds
        this.shootingStarInterval = Math.random() * 15000 + 45000;
    }
    
    updateShootingStar() {
        if (!this.shootingStar) return;
        
        // Update shooting star position
        this.shootingStar.x += Math.cos(this.shootingStar.angle) * this.shootingStar.speed;
        this.shootingStar.y += Math.sin(this.shootingStar.angle) * this.shootingStar.speed;
        
        // Update trail
        this.shootingStar.trail.unshift({
            x: this.shootingStar.x, 
            y: this.shootingStar.y,
            opacity: this.shootingStar.opacity
        });
        
        // Limit trail length
        if (this.shootingStar.trail.length > this.shootingStar.length / this.shootingStar.speed) {
            this.shootingStar.trail.pop();
        }
        
        // Occasionally add sparkles
        if (Math.random() > 0.9 && this.shootingStar.opacity > 0.5) {
            // Add a sparkle at the head position with random velocity
            const sparkleVx = (Math.random() - 0.5) * 1.5;
            const sparkleVy = (Math.random() - 0.5) * 1.5;
            const sparkleLife = Math.random() * 20 + 10;
            
            this.shootingStar.sparkles.push({
                x: this.shootingStar.x,
                y: this.shootingStar.y,
                vx: sparkleVx,
                vy: sparkleVy,
                size: Math.random() * 1.5 + 0.5,
                life: sparkleLife,
                maxLife: sparkleLife,
                color: this.shootingStar.color
            });
        }
        
        // Update sparkles
        for (let i = this.shootingStar.sparkles.length - 1; i >= 0; i--) {
            const sparkle = this.shootingStar.sparkles[i];
            
            // Move sparkle
            sparkle.x += sparkle.vx;
            sparkle.y += sparkle.vy;
            
            // Reduce life
            sparkle.life--;
            
            // Remove dead sparkles
            if (sparkle.life <= 0) {
                this.shootingStar.sparkles.splice(i, 1);
            }
        }
        
        // Handle fade in/out
        if (this.shootingStar.fadeIn) {
            this.shootingStar.opacity += 0.1;
            if (this.shootingStar.opacity >= 1) {
                this.shootingStar.fadeIn = false;
            }
        } else {
            // Start fading out near edges or after traveling a certain distance
            const edgeDistance = Math.min(
                this.width - this.shootingStar.x,
                this.height - this.shootingStar.y
            );
            
            const traveledDistance = this.shootingStar.trail.length * this.shootingStar.speed;
            
            if (edgeDistance < 100 || traveledDistance > this.shootingStar.length * 1.5) {
                this.shootingStar.opacity -= 0.05;
            }
        }
        
        // Remove if completely faded or out of bounds
        if (this.shootingStar.opacity <= 0 || 
            this.shootingStar.x < -50 || 
            this.shootingStar.x > this.width + 50 || 
            this.shootingStar.y < -50 || 
            this.shootingStar.y > this.height + 50) {
            this.shootingStar = null;
        }
    }

    draw() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw each particle (stars) - back to front for proper depth
        const layers = ['back', 'middle', 'front'];
        
        layers.forEach(layer => {
            // Draw stars in this layer
            this.particles.filter(p => p.layer === layer).forEach(particle => {
                this.ctx.beginPath();
                
                // Create gradient for glow effect
                const gradient = this.ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.size * 2
                );
                
                gradient.addColorStop(0, particle.color);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.globalAlpha = particle.opacity;
                
                // Draw circle
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        });
        
        // Reset opacity
        this.ctx.globalAlpha = 1;
    }

    update() {
        // Update particle positions and properties (twinkling stars)
        this.particles.forEach(particle => {
            // Move the particle based on its velocity
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Different twinkle patterns
            let pulseFactor = 1;
            
            switch(particle.twinkleType) {
                case 0: // Simple sine wave
                    particle.angle += particle.pulse;
                    pulseFactor = Math.sin(particle.angle) * 0.5 + 1;
                    break;
                case 1: // Faster/sharper twinkle
                    particle.angle += particle.pulse * 1.5;
                    pulseFactor = Math.sin(particle.angle) * 0.7 + 1;
                    break;
                case 2: // Gentle slow pulse
                    particle.angle += particle.pulse * 0.8;
                    pulseFactor = Math.sin(particle.angle) * 0.3 + 1;
                    break;
            }
            
            particle.size = particle.originalSize * pulseFactor;
            
            // Wrap around the edges if the particle goes off-screen
            if (particle.x < -particle.size) particle.x = this.width + particle.size;
            if (particle.x > this.width + particle.size) particle.x = -particle.size;
            if (particle.y < -particle.size) particle.y = this.height + particle.size;
            if (particle.y > this.height + particle.size) particle.y = -particle.size;
        });
    }

    animate() {
        // Start animation loop
        this.isRunning = true;
        
        const loop = () => {
            if (!this.isRunning) return;
            
            // Clear canvas
            this.ctx.clearRect(0, 0, this.width, this.height);
            
            // Update and draw particles
            this.update();
            this.draw();
            
            // Check if it's time to create a shooting star
            if (!this.shootingStar) {
                this.createShootingStar();
            }
            
            // Update and draw shooting star if exists
            if (this.shootingStar) {
                this.updateShootingStar();
                this.drawShootingStar();
            }
            
            // Continue animation loop
            requestAnimationFrame(loop);
        };
        
        // Start the loop
        loop();
    }

    drawShootingStar() {
        if (!this.shootingStar) return;
        
        const ctx = this.ctx;
        
        // Draw the trail
        if (this.shootingStar.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.shootingStar.trail[0].x, this.shootingStar.trail[0].y);
            
            // Create gradient for the trail
            const gradient = ctx.createLinearGradient(
                this.shootingStar.trail[0].x, 
                this.shootingStar.trail[0].y,
                this.shootingStar.trail[this.shootingStar.trail.length - 1].x,
                this.shootingStar.trail[this.shootingStar.trail.length - 1].y
            );
            
            gradient.addColorStop(0, this.shootingStar.color);
            gradient.addColorStop(1, this.shootingStar.color.replace('0.9)', '0)'));
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            
            // Draw the curved trail
            for (let i = 1; i < this.shootingStar.trail.length; i++) {
                ctx.lineTo(this.shootingStar.trail[i].x, this.shootingStar.trail[i].y);
            }
            
            ctx.stroke();
        }
        
        // Draw the head (leading point)
        ctx.beginPath();
        ctx.arc(this.shootingStar.x, this.shootingStar.y, this.shootingStar.headSize, 0, Math.PI * 2, false);
        
        // Create a radial gradient for the glowing head
        const headGradient = ctx.createRadialGradient(
            this.shootingStar.x, this.shootingStar.y, 0,
            this.shootingStar.x, this.shootingStar.y, this.shootingStar.headSize * 2
        );
        
        headGradient.addColorStop(0, this.shootingStar.color);
        headGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = headGradient;
        ctx.fill();
        
        // Draw sparkles
        for (const sparkle of this.shootingStar.sparkles) {
            const opacity = (sparkle.life / sparkle.maxLife) * 0.7;
            ctx.globalAlpha = opacity;
            
            ctx.beginPath();
            ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2, false);
            ctx.fillStyle = sparkle.color;
            ctx.fill();
        }
        
        // Reset opacity
        ctx.globalAlpha = 1;
    }

    // Stop the animation if needed
    stop() {
        this.isRunning = false;
    }
}

// Initialize the particle background when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if reduced motion is preferred
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Only initialize particles if motion is not reduced
    if (!prefersReducedMotion) {
        const particleBackground = new ParticleBackground();
    } else {
        // For reduced motion preference, set a static background
        const particlesElement = document.getElementById('particles');
        if (particlesElement) {
            particlesElement.style.background = 'linear-gradient(135deg, #0a0321, #1a0b2e)';
        }
    }
}); 