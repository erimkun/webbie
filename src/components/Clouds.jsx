import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Clouds() {
  const cloudsData = useMemo(() => {
    const clouds = []
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2
      const radius = 60 + Math.random() * 30
      clouds.push({
        position: [
          Math.cos(angle) * radius,
          25 + Math.random() * 20,
          Math.sin(angle) * radius
        ],
        scale: 1 + Math.random() * 2,
        speed: 0.1 + Math.random() * 0.2,
        offset: Math.random() * 100
      })
    }
    return clouds
  }, [])

  return (
    <group>
      {cloudsData.map((cloud, i) => (
        <Cloud key={i} {...cloud} index={i} />
      ))}
    </group>
  )
}

function Cloud({ position, scale, speed, offset, index }) {
  const groupRef = useRef()
  const initialPos = useMemo(() => [...position], [position])

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime
      // Yavaş hareket
      groupRef.current.position.x = initialPos[0] + Math.sin(time * speed + offset) * 5
      groupRef.current.position.z = initialPos[2] + Math.cos(time * speed * 0.5 + offset) * 3
    }
  })

  // Bulut parçaları
  const cloudParts = useMemo(() => {
    return [
      { pos: [0, 0, 0], size: 3 },
      { pos: [2.5, 0.3, 0], size: 2.5 },
      { pos: [-2.5, 0.2, 0], size: 2.3 },
      { pos: [1, 0.5, 1], size: 2 },
      { pos: [-1, 0.4, -1], size: 2.2 },
      { pos: [0, 0.6, 1.5], size: 1.8 },
    ]
  }, [])

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {cloudParts.map((part, i) => (
        <mesh key={i} position={part.pos}>
          <sphereGeometry args={[part.size, 12, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={1}
            metalness={0}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  )
}
