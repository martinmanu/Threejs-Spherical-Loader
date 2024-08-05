import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private sphere!: THREE.Mesh;
  private animationId!: number;
  private circles: { mesh: THREE.Mesh; radius: number }[] = [];
  private connections: THREE.Line[] = [];
  private numCircles = 50;
  private readonly circleColor = 0x0000ff; // Blue color for circles and connections
  private readonly rotationSpeed = 0.001; // Reduced rotation speed
  private readonly minCircleRadius = 0.05;
  private readonly maxCircleRadius = 0.2;
  private readonly sphereRadius = 1;
  private readonly circleGap = 0.05; // Gap between circles

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initThreeJs();
    this.addSphere();
    this.addCircles();
    this.animate();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
  }

  private initThreeJs(): void {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container')!.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  private addSphere(): void {
    const geometry = new THREE.SphereGeometry(this.sphereRadius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000, // Black color for the sphere's wireframe
      wireframe: true,
      transparent: true,
      opacity: 0 // Fully transparent to hide the axis lines
    });
    this.sphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.sphere);
  }

  private addCircles(): void {
    const circleMaterial = new THREE.MeshBasicMaterial({ color: this.circleColor, depthTest: false });

    for (let i = 0; i < this.numCircles; i++) {
      const radius = Math.random() * (this.maxCircleRadius - this.minCircleRadius) + this.minCircleRadius;
      const circleGeometry = new THREE.CircleGeometry(radius, 32);
      const circle = new THREE.Mesh(circleGeometry, circleMaterial);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const distance = this.sphereRadius + radius + this.circleGap;
      const x = distance * Math.sin(phi) * Math.cos(theta);
      const y = distance * Math.sin(phi) * Math.sin(theta);
      const z = distance * Math.cos(phi);

      // Set initial position
      circle.position.set(x, y, z);
      circle.lookAt(0, 0, 0);

      // Store the circle and its radius
      this.circles.push({ mesh: circle, radius });

      // Add circles as children of the sphere
      this.sphere.add(circle);
    }

    this.connectCircles();
  }

  private connectCircles(): void {
    const lineMaterial = new THREE.LineBasicMaterial({ color: this.circleColor });

    // Remove existing connections
    this.connections.forEach(connection => this.scene.remove(connection));
    this.connections = [];

    // Create new connections
    for (let i = 0; i < this.circles.length; i++) {
      let closestIndex = -1;
      let closestDistance = Infinity;

      for (let j = 0; j < this.circles.length; j++) {
        if (i !== j) {
          const distance = this.circles[i].mesh.position.distanceTo(this.circles[j].mesh.position);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = j;
          }
        }
      }

      if (closestIndex !== -1) {
        const points = [this.circles[i].mesh.position.clone(), this.circles[closestIndex].mesh.position.clone()];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, lineMaterial);
        this.connections.push(line);
        this.scene.add(line);
      }
    }
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    // Rotate the sphere with reduced speed
    this.sphere.rotation.y += this.rotationSpeed;

    // Update circle positions and connections
    this.updateCirclePositions();
    this.updateConnections();
    this.renderer.render(this.scene, this.camera);
  }

  private updateCirclePositions(): void {
    this.circles.forEach(circleObj => {
      const { mesh: circle, radius } = circleObj;
      // Update the position of each circle based on its parent sphere's rotation
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const distance = this.sphereRadius + radius + this.circleGap;
      const x = distance * Math.sin(phi) * Math.cos(theta);
      const y = distance * Math.sin(phi) * Math.sin(theta);
      const z = distance * Math.cos(phi);

      circle.position.set(x, y, z);
      circle.lookAt(0, 0, 0);
    });
  }

  private updateConnections(): void {
    // Remove old connections
    this.connections.forEach(connection => this.scene.remove(connection));
    this.connections = [];

    // Recreate connections based on updated circle positions
    this.connectCircles();
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}