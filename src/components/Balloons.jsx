import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Balloons() {
  const balloonData = useMemo(() => {
    return [
      { position: [-20, 25, -30], color: '#ff69b4', stripeColor: '#ffffff', speed: 0.3 },
      { position: [25, 28, -35], color: '#87ceeb', stripeColor: '#ffffff', speed: 0.25 },
      { position: [0, 32, -40], color: '#ffffff', stripeColor: '#ffb6c1', speed: 0.35 },
      { position: [-35, 26, -25], color: '#dda0dd', stripeColor: '#ffffff', speed: 0.28 },
      { position: [35, 30, -30], color: '#ffffff', stripeColor: '#87ceeb', speed: 0.32 },
      { position: [10, 35, -45], color: '#ffc0cb', stripeColor: '#ff69b4', speed: 0.22 },
    ]
  }, [])

  return (
    <group>
      {balloonData.map((balloon, i) => (
        <Balloon key={i} {...balloon} index={i} />
      ))}
    </group>
  )
}

function Balloon({ position, color, stripeColor, speed, index }) {
  const groupRef = useRef()
  const initialPos = useMemo(() => [...position], [position])

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime
      
      // Yavaş hareket
      groupRef.current.position.x = initialPos[0] + Math.sin(time * speed + index) * 2
      groupRef.current.position.y = initialPos[1] + Math.sin(time * speed * 0.5 + index * 2) * 1
      groupRef.current.position.z = initialPos[2] + Math.cos(time * speed * 0.3 + index) * 1.5
      
      // Hafif dönme
      groupRef.current.rotation.y = Math.sin(time * 0.2 + index) * 0.1
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Ana balon */}
      <mesh castShadow>
        <sphereGeometry args={[3, 24, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>
      
      {/* Balon çizgileri */}
      {[...Array(8)].map((_, i) => (
        <mesh key={i} rotation={[0, (i / 8) * Math.PI, 0]}>
          <torusGeometry args={[3, 0.08, 8, 32, Math.PI]} />
          <meshStandardMaterial color={stripeColor} />
        </mesh>
      ))}
      
      {/* Balon alt kısmı */}
      <mesh position={[0, -2.5, 0]}>
        <coneGeometry args={[1.5, 1.5, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      
      {/* İpler */}
      {[[-0.3, 0], [0.3, 0], [0, -0.3], [0, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, -4.5, z]}>
          <cylinderGeometry args={[0.02, 0.02, 4, 8]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
      ))}
      
      {/* Sepet */}
      <mesh position={[0, -7, 0]} castShadow>
        <boxGeometry args={[1.2, 0.8, 1.2]} />
        <meshStandardMaterial color="#8b4513" roughness={0.9} />
      </mesh>
    </group>
  )
}
