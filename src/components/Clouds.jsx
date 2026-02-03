import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Clouds() {
  const cloudsData = useMemo(() => {
    const clouds = []
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const radius = 70 + Math.random() * 40
      clouds.push({
        position: [
          Math.cos(angle) * radius,
          30 + Math.random() * 25,
          Math.sin(angle) * radius
        ],
        scale: 1.5 + Math.random() * 2.5,
        speed: 0.05 + Math.random() * 0.1,
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

  // Bulut parçaları - daha yumuşak ve büyük
  const cloudParts = useMemo(() => {
    return [
      { pos: [0, 0, 0], size: 4 },
      { pos: [3.5, 0.4, 0], size: 3.2 },
      { pos: [-3.5, 0.3, 0], size: 3.0 },
      { pos: [1.5, 0.7, 1.5], size: 2.8 },
      { pos: [-1.5, 0.5, -1.5], size: 2.6 },
      { pos: [0, 0.8, 2], size: 2.4 },
      { pos: [2.5, 0.3, -1], size: 2.2 },
      { pos: [-2, 0.6, 1], size: 2.0 },
    ]
  }, [])

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {cloudParts.map((part, i) => (
        <mesh key={i} position={part.pos}>
          <sphereGeometry args={[part.size, 16, 12]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={1}
            metalness={0}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
