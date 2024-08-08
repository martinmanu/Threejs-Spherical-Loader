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
  private readonly circleGap = 0.1;  // Adjust this value as needed
  private circles: THREE.Mesh[] = [];
  private connections: THREE.Line[] = [];
  private numCircles = 45;
  private readonly circleColor = `#d60cfa`;
  private rotationSpeed = 0.05;
  private readonly minCircleRadius = 0.05;
  private readonly maxCircleRadius = 0.2;
  private readonly sphereRadius = 1 ;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initThreeJs();
    this.addSphere();
    this.addCircles();
    this.addCoordinateLines();
    // this.createConnections();
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
      color: 0x000000,
      wireframe: true,
      transparent: true,
      opacity: 0
    });
    this.sphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.sphere);
  }

  private addCircles(): void {
    const circleMaterial = new THREE.MeshBasicMaterial({ color: this.circleColor });
  
    for (let i = 0; i < this.numCircles; i++) {
      let radius = Math.random() * (this.maxCircleRadius - this.minCircleRadius) + this.minCircleRadius;
      let circleGeometry = new THREE.CircleGeometry(radius, 32);
      let circle = new THREE.Mesh(circleGeometry, circleMaterial);
  
      circle.userData['radius'] = radius;
  
      let isOverlapping = true;
      let theta, phi, distance, x, y, z;
  
      while (isOverlapping) {
        theta = Math.random() * Math.PI * 2;
        phi = Math.acos((Math.random() * 2) - 1);
        distance = this.sphereRadius;
  
        x = distance * Math.sin(phi) * Math.cos(theta);
        y = distance * Math.sin(phi) * Math.sin(theta);
        z = distance * Math.cos(phi);
  
        circle.position.set(x, y, z);
        circle.lookAt(0, 0, 0);
  
        // Check for overlaps using the radius from userData
        isOverlapping = this.circles.some(otherCircle => {
          const otherRadius = otherCircle.userData['radius'];
          return circle.position.distanceTo(otherCircle.position) < (radius + otherRadius + this.circleGap);
        });
      }
  
      this.circles.push(circle);
      this.sphere.add(circle);
    }
  }
  
  

  private createConnections(): void {
    const lineMaterial = new THREE.LineBasicMaterial({ color: this.circleColor });
  
    for (let i = 0; i < this.circles.length; i++) {
      let closestIndex = -1;
      let closestDistance = Infinity;
  
      for (let j = 0; j < this.circles.length; j++) {
        if (i !== j) {
          const distance = this.circles[i].position.distanceTo(this.circles[j].position);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = j;
          }
        }
      }
  
      if (closestIndex !== -1) {
        const points = [
          this.circles[i].position.clone(),
          this.circles[closestIndex].position.clone()
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, lineMaterial);
        
        // Ensure start and end circles are set correctly
        // Ensure start and end circles are set correctly
        line.userData['start'] = this.circles[i];
        line.userData['end'] = this.circles[closestIndex];
  
        this.connections.push(line);
        this.scene.add(line);
      }
    }
  }

  private addCoordinateLines(): void {
    const lineMaterial = new THREE.LineBasicMaterial({ color: '#efa4fc' }); // Match circle color
  
    // Create longitude lines
    for (let i = 0; i < 360; i += 30) { // Adjust the step for more/less lines
      const angle = THREE.MathUtils.degToRad(i);
      const points: THREE.Vector3[] = [];
  
      for (let j = -90; j <= 90; j += 30) { // Adjust the step for more/less lines
        const latitude = THREE.MathUtils.degToRad(j);
        const x = this.sphereRadius * Math.cos(latitude) * Math.cos(angle);
        const y = this.sphereRadius * Math.cos(latitude) * Math.sin(angle);
        const z = this.sphereRadius * Math.sin(latitude);
        points.push(new THREE.Vector3(x, y, z));
      }
  
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      this.scene.add(line);
    }
  
    // Create latitude lines
    for (let i = -80; i <= 80; i += 30) { // Adjust the step for more/less lines
      const latitude = THREE.MathUtils.degToRad(i);
      const points: THREE.Vector3[] = [];
  
      for (let j = 0; j < 360; j += 30) { // Adjust the step for more/less lines
        const angle = THREE.MathUtils.degToRad(j);
        const x = this.sphereRadius * Math.cos(latitude) * Math.cos(angle);
        const y = this.sphereRadius * Math.cos(latitude) * Math.sin(angle);
        const z = this.sphereRadius * Math.sin(latitude);
        points.push(new THREE.Vector3(x, y, z));
      }
  
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      this.scene.add(line);
    }
  }
  
  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
  
    // Rotate the sphere and its child circles
    this.sphere.rotation.y += this.rotationSpeed;
    
    // Rotate all coordinate lines with the sphere
    this.scene.traverse((object) => {
      if (object instanceof THREE.Line) {
        object.rotation.y = this.sphere.rotation.y;
      }
    });
  
    // Update the connections
    this.updateConnections();
  
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }


  private toggleCoordinateLinesVisibility(visible: boolean): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Line) {
        object.visible = visible;
      }
    });
  }
  
  private updateConnections(): void {
    this.connections.forEach((connection, index) => {
      const startCircle = connection.userData['start'];
      const endCircle = connection.userData['end'];
  
      if (startCircle && endCircle) {
        const positions = connection.geometry.attributes['position'].array as Float32Array;
  
        positions[0] = startCircle.position.x;
        positions[1] = startCircle.position.y;
        positions[2] = startCircle.position.z;
  
        positions[3] = endCircle.position.x;
        positions[4] = endCircle.position.y;
        positions[5] = endCircle.position.z;
  
        connection.geometry.attributes['position'].needsUpdate = true;
        console.log(`Connection ${index}:`, positions);

        // Ensure the geometry is updated
        connection.geometry.computeBoundingBox();
        connection.geometry.computeBoundingSphere();
      }
    });
  }
  
  

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}