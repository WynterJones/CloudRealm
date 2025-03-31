import * as THREE from "three";

interface PortalOptions {
  labelText?: string;
  labelColor?: string;
}

interface PortalUserData {
  particlesGeometry: THREE.BufferGeometry;
  type: "entrance" | "exit";
}

interface PortalWrapper extends THREE.Group {
  userData: {
    portal: THREE.Group;
    particlesGeometry: THREE.BufferGeometry;
    type: "entrance" | "exit";
  };
}

export class PortalManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private socket: any; // TODO: Replace with proper socket type
  private startPortal: PortalWrapper | null;
  private exitPortal: PortalWrapper | null;
  private startPortalBox: THREE.Box3 | null;
  private exitPortalBox: THREE.Box3 | null;
  private playerCheckInterval: ReturnType<typeof setTimeout> | null;

  constructor(scene: THREE.Scene, camera: THREE.Camera, socket: any) {
    this.scene = scene;
    this.camera = camera;
    this.socket = socket;
    this.startPortal = null;
    this.exitPortal = null;
    this.startPortalBox = null;
    this.exitPortalBox = null;
    this.playerCheckInterval = null;
  }

  // Create a portal mesh with proper alignment and origin at bottom
  createPortalMesh(
    radius = 6,
    color = 0xff0000,
    options: PortalOptions = {}
  ): PortalWrapper {
    // Create a single container for the portal elements
    const portal = new THREE.Group();

    // Create the torus ring
    const tubeRadius = radius * 0.1;
    const ringGeometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 100);
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      transparent: true,
      opacity: 0.8,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    portal.add(ring);

    // Create portal inner surface
    const innerRadius = radius * 0.9;
    const innerGeometry = new THREE.CircleGeometry(innerRadius, 32);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const inner = new THREE.Mesh(innerGeometry, innerMaterial);
    portal.add(inner);

    // Create particle system for portal effect
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Create particles in a ring around the portal
      const angle = Math.random() * Math.PI * 2;
      const particleRadius = radius + (Math.random() - 0.5) * (radius * 0.15);

      // Position particles in a ring in the same plane as the portal
      particlePositions[i] = Math.cos(angle) * particleRadius; // x
      particlePositions[i + 1] = Math.sin(angle) * particleRadius; // y
      particlePositions[i + 2] = (Math.random() - 0.5) * (radius * 0.15); // z (small depth variation)

      // Set color with slight variation
      if (color === 0xff0000) {
        // Red portal
        particleColors[i] = 0.8 + Math.random() * 0.2;
        particleColors[i + 1] = 0;
        particleColors[i + 2] = 0;
      } else {
        // Green portal
        particleColors[i] = 0;
        particleColors[i + 1] = 0.8 + Math.random() * 0.2;
        particleColors[i + 2] = 0;
      }
    }

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );
    particlesGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(particleColors, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: radius * 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    });

    const particles = new THREE.Points(particlesGeometry, particleMaterial);
    portal.add(particles);

    // Store particles for animation
    portal.userData = {
      particlesGeometry: particlesGeometry,
      type: color === 0xff0000 ? "entrance" : "exit",
    };

    // Set default label text based on portal type
    const defaultLabelText =
      portal.userData.type === "entrance" ? "Go back" : "To Vibeverse";

    // Get label text from options or use default
    const labelText = options.labelText || defaultLabelText;

    // Create a wrapper container with origin at bottom
    const wrapper = new THREE.Group() as PortalWrapper;

    // Add label if text is provided
    if (labelText) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return wrapper; // Skip label creation if context is null

      // Increase canvas size for larger text
      canvas.width = 1024;
      canvas.height = 128;

      // Get label color from options or use portal color
      const labelColor =
        options.labelColor || (color === 0xff0000 ? "#ff0000" : "#00ff00");

      context.fillStyle = labelColor;

      // Larger font size for the exit portal
      const fontSize = color === 0xff0000 ? 32 : 48;
      context.font = `bold ${fontSize}px Arial`;
      context.textAlign = "center";
      context.fillText(labelText, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      const labelGeometry = new THREE.PlaneGeometry(
        radius * 1.6,
        radius * 0.35
      );
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      });

      const label = new THREE.Mesh(labelGeometry, labelMaterial);

      // Position label based on portal type
      if (color === 0xff0000) {
        // Entrance portal - position above
        label.position.y = radius * 1.5;
      } else {
        // Exit portal - position closer and in front
        label.position.y = radius * 1.2;
        label.position.z = radius * 0.1; // Slightly in front of portal
        // Rotate text 180 degrees around Y axis to face correct direction
        label.rotation.y = Math.PI;
      }

      portal.add(label);
    }

    // Add portal to wrapper at origin first
    wrapper.add(portal);

    // Compute the portal's bounding box to get actual dimensions
    const bbox = new THREE.Box3().setFromObject(portal);

    // Position portal so its bottom is at y=0 of the wrapper
    // This ensures the bottom of the portal sits exactly on the ground
    portal.position.y = -bbox.min.y; // Offset to make bottom align with y=0

    // Store reference to portal for animations
    wrapper.userData = {
      portal: portal,
      particlesGeometry: portal.userData.particlesGeometry,
      type: portal.userData.type,
    };

    return wrapper;
  }

  // Create entrance portal at specified coordinates
  createStartPortal(
    x = 0,
    y = 0,
    z = 0,
    radius = 6,
    options: PortalOptions = {}
  ): PortalWrapper {
    // Create portal mesh with default or custom options
    const portal = this.createPortalMesh(radius, 0xff0000, {
      labelText: options.labelText || "Go back",
      labelColor: options.labelColor || "#ff0000",
    });

    // Position the portal
    portal.position.x = x;
    portal.position.y = y;
    portal.position.z = z;

    // Add portal to scene
    this.scene.add(portal);

    // Create portal collision box
    this.startPortalBox = new THREE.Box3().setFromObject(portal);

    // Store portal reference
    this.startPortal = portal;

    // Start animation
    this.animateStartPortal();

    return portal;
  }

  // Create exit portal at specified coordinates
  createExitPortal(
    x = 0,
    y = 0,
    z = 0,
    radius = 6,
    options: PortalOptions = {}
  ): PortalWrapper {
    // Create portal mesh with default or custom options
    const portal = this.createPortalMesh(radius, 0x00ff00, {
      labelText: options.labelText || "To Vibeverse",
      labelColor: options.labelColor || "#00ff00",
    });

    // Position the portal
    portal.position.x = x;
    portal.position.y = y;
    portal.position.z = z;

    // Add portal to scene
    this.scene.add(portal);

    // Create portal collision box
    this.exitPortalBox = new THREE.Box3().setFromObject(portal);

    // Store portal reference
    this.exitPortal = portal;

    // Start animation
    this.animateExitPortal();

    return portal;
  }

  // Animate entrance portal particles
  animateStartPortal(): void {
    if (!this.startPortal || !this.startPortal.userData) return;

    // Get the particles geometry from the userData
    const particlesGeometry = this.startPortal.userData.particlesGeometry;
    if (!particlesGeometry) return;

    const positions = particlesGeometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      // Animate particles moving in/out slightly
      positions[i + 2] = Math.sin(Date.now() * 0.002 + i) * 0.3;
    }

    particlesGeometry.attributes.position.needsUpdate = true;
    requestAnimationFrame(this.animateStartPortal.bind(this));
  }

  // Animate exit portal particles
  animateExitPortal(): void {
    if (!this.exitPortal || !this.exitPortal.userData) return;

    // Get the particles geometry from the userData
    const particlesGeometry = this.exitPortal.userData.particlesGeometry;
    if (!particlesGeometry) return;

    const positions = particlesGeometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      // Animate particles moving in/out slightly
      positions[i + 2] = Math.sin(Date.now() * 0.002 + i) * 0.3;
    }

    particlesGeometry.attributes.position.needsUpdate = true;
    requestAnimationFrame(this.animateExitPortal.bind(this));
  }

  // Check if player has entered a portal
  checkPortalCollisions(player: {
    position: { x: number; y: number; z: number };
  }): void {
    if (!player) return;

    // Use player camera position for collision detection
    const playerPosition = new THREE.Vector3(
      player.position.x,
      player.position.y,
      player.position.z
    );

    // Check entrance portal collision
    if (this.startPortalBox && this.startPortal) {
      // Update box to match current position
      this.startPortalBox.setFromObject(this.startPortal);

      // Expand the box slightly for better collision detection
      const expandedStartBox = this.startPortalBox.clone().expandByScalar(1.5);
      if (expandedStartBox.containsPoint(playerPosition)) {
        this.handleStartPortalEntry();
      }
    }

    // Check exit portal collision
    if (this.exitPortalBox && this.exitPortal) {
      // Update box to match current position
      this.exitPortalBox.setFromObject(this.exitPortal);

      // Expand the box slightly for better collision detection
      const expandedExitBox = this.exitPortalBox.clone().expandByScalar(1.5);
      if (expandedExitBox.containsPoint(playerPosition)) {
        this.handleExitPortalEntry();
      }
    }
  }

  // Handle entrance portal interaction
  handleStartPortalEntry(): void {
    // Get ref from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const refUrl = urlParams.get("ref");
    if (refUrl) {
      // Add https if not present and include query params
      let url = refUrl;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      // Copy all current parameters except 'ref' to preserve game state when returning
      const currentParams = new URLSearchParams(window.location.search);
      const newParams = new URLSearchParams();
      for (const [key, value] of currentParams) {
        if (key !== "ref") {
          newParams.append(key, value);
        }
      }

      const paramString = newParams.toString();
      window.location.href = url + (paramString ? "?" + paramString : "");
    } else {
      // If no ref parameter, show an error message
      this.showNoReturnMessage();
    }
  }

  // Display a message when there's nowhere to return to
  showNoReturnMessage(): void {
    // Create message element if it doesn't exist
    if (!document.getElementById("portal-message")) {
      const messageEl = document.createElement("div");
      messageEl.id = "portal-message";
      messageEl.style.position = "fixed";
      messageEl.style.top = "20%";
      messageEl.style.left = "50%";
      messageEl.style.transform = "translateX(-50%)";
      messageEl.style.padding = "15px 30px";
      messageEl.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      messageEl.style.color = "white";
      messageEl.style.borderRadius = "5px";
      messageEl.style.fontFamily = "Arial, sans-serif";
      messageEl.style.fontSize = "18px";
      messageEl.style.zIndex = "1000";
      messageEl.style.textAlign = "center";
      messageEl.innerText = "No destination to return to...";

      document.body.appendChild(messageEl);

      // Remove message after 3 seconds
      setTimeout(() => {
        const msg = document.getElementById("portal-message");
        if (msg) {
          msg.style.opacity = "0";
          msg.style.transition = "opacity 0.5s ease";

          setTimeout(() => {
            if (msg && msg.parentNode) {
              msg.parentNode.removeChild(msg);
            }
          }, 500);
        }
      }, 3000);
    }
  }

  // Handle exit portal interaction
  handleExitPortalEntry(): void {
    // Create parameters for the next page
    const newParams = new URLSearchParams();

    // Essential parameters
    newParams.append("portal", "true"); // Indicate this is a portal entrance

    // Player information - get from socket if available
    if (this.socket && this.socket.id) {
      newParams.append("username", this.socket.id);
    } else {
      // Generate a random username if not available
      newParams.append(
        "username",
        "player_" + Math.floor(Math.random() * 10000)
      );
    }

    // Set player color to white as default
    newParams.append("color", "white");

    // Add current URL as reference for return portal
    const currentUrl = window.location.host + window.location.pathname;
    newParams.append("ref", currentUrl);

    // Add additional optional parameters if available
    // Speed parameters - defaulting to reasonable values
    newParams.append("speed", "3"); // Default walking speed

    // Copy any other useful parameters from current URL
    const currentParams = new URLSearchParams(window.location.search);
    for (const [key, value] of currentParams) {
      if (!newParams.has(key) && key !== "portal") {
        newParams.append(key, value);
      }
    }

    const paramString = newParams.toString();
    const nextPage =
      "http://portal.pieter.com" + (paramString ? "?" + paramString : "");

    // Create hidden iframe to preload next page
    if (!document.getElementById("preloadFrame")) {
      const iframe = document.createElement("iframe");
      iframe.id = "preloadFrame";
      iframe.style.display = "none";
      iframe.src = nextPage;
      document.body.appendChild(iframe);
    }

    // Navigate to the next page
    window.location.href = nextPage;
  }

  // Update method to be called each frame
  update(): void {
    // No need to update collision boxes every frame, we update them in checkPortalCollisions
  }
}
