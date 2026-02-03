import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Water() {
  const waterRef = useRef()
  
  // Su dalgası animasyonu için shader material
  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  // Su için özel shader
  const waterMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#0077be') },
        uColor2: { value: new THREE.Color('#00a8cc') },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vElevation;
        uniform float uTime;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Dalga efekti
          float wave1 = sin(pos.x * 0.5 + uTime * 0.5) * 0.1;
          float wave2 = sin(pos.y * 0.3 + uTime * 0.3) * 0.1;
          pos.z += wave1 + wave2;
          vElevation = wave1 + wave2;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          float mixStrength = (vElevation + 0.2) * 2.5;
          vec3 color = mix(uColor1, uColor2, mixStrength);
          
          // Parlaklık efekti
          float sparkle = sin(vUv.x * 50.0 + uTime) * sin(vUv.y * 50.0 + uTime * 0.7);
          color += sparkle * 0.05;
          
          gl_FragColor = vec4(color, 0.85);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    })
  }, [])

  // Sahil şeridi pozisyonları
  const beachPositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 0.6 + Math.PI * 0.7
      const radius = 38
      positions.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        angle
      })
    }
    return positions
  }, [])

  return (
    <group>
      {/* Ana su alanı */}
      <mesh
        ref={waterRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-35, 0.1, 25]}
        material={waterMaterial}
      >
        <planeGeometry args={[30, 40, 32, 32]} />
      </mesh>

      {/* Kumsal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-25, 0.08, 20]}>
        <planeGeometry args={[20, 30]} />
        <meshStandardMaterial color="#f4d03f" roughness={1} />
      </mesh>

      {/* Kumsal detayları */}
      {beachPositions.map((pos, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, pos.angle]}
          position={[pos.x, 0.05, pos.z]}
        >
          <circleGeometry args={[2 + Math.random(), 16]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#e6c34d' : '#daa520'}
            roughness={1}
          />
        </mesh>
      ))}

      {/* Okyanus (uzak görünüm) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-45, -0.5, 30]}>
        <planeGeometry args={[50, 60]} />
        <meshStandardMaterial
          color="#006994"
          roughness={0.3}
          metalness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  )
}
