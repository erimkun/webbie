import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Fauna() {
  const birds = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
    position: [
      (Math.random() - 0.5) * 100,
      15 + Math.random() * 10,
      (Math.random() - 0.5) * 100
    ],
    speed: 0.2 + Math.random() * 0.2,
    offset: Math.random() * 100
  })), [])
  
  const butterflies = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    position: [
      (Math.random() - 0.5) * 40,
      2 + Math.random() * 3,
      (Math.random() - 0.5) * 40
    ],
    color: ['#FF69B4', '#FFFF00', '#00FFFF', '#FFA500'][Math.floor(Math.random() * 4)],
    speed: 0.5 + Math.random() * 0.5,
    offset: Math.random() * 100
  })), [])

  return (
    <group>
      {birds.map((props, i) => <Bird key={`bird-${i}`} {...props} />)}
      {butterflies.map((props, i) => <Butterfly key={`butterfly-${i}`} {...props} />)}
    </group>
  )
}

function Bird({ position, speed, offset }) {
  const group = useRef()
  const leftWing = useRef()
  const rightWing = useRef()
  const initialPos = useMemo(() => new THREE.Vector3(...position), [position])
  
  useFrame((state) => {
    const t = state.clock.elapsedTime + offset
    
    // Yörünge hareketi
    group.current.position.x = initialPos.x + Math.sin(t * speed * 0.5) * 20
    group.current.position.z = initialPos.z + Math.cos(t * speed * 0.5) * 20
    group.current.position.y = initialPos.y + Math.sin(t * speed) * 2
    
    // Yön değiştirme (yörüngeye teğet)
    group.current.rotation.y = Math.atan2(
      Math.cos(t * speed * 0.5), 
      -Math.sin(t * speed * 0.5)
    )

    // Kanat çırpma
    leftWing.current.rotation.z = Math.sin(t * 15) * 0.5
    rightWing.current.rotation.z = -Math.sin(t * 15) * 0.5
  })

  return (
    <group ref={group} position={position}>
      {/* Gövde */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.2, 0.8, 4]} />
        <meshStandardMaterial color="#333" rotation={[Math.PI / 2, 0, 0]} />
      </mesh>
      
      {/* Kanatlar */}
      <mesh ref={leftWing} position={[0.2, 0, 0]}>
        <boxGeometry args={[0.8, 0.05, 0.3]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh ref={rightWing} position={[-0.2, 0, 0]}>
        <boxGeometry args={[0.8, 0.05, 0.3]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  )
}

function Butterfly({ position, color, speed, offset }) {
  const group = useRef()
  const leftWing = useRef()
  const rightWing = useRef()
  const initialPos = useMemo(() => new THREE.Vector3(...position), [position])

  useFrame((state) => {
    const t = state.clock.elapsedTime + offset
    
    // Rastgele uçuş
    group.current.position.x = initialPos.x + Math.sin(t * speed) * 2 + Math.cos(t * speed * 2) * 1
    group.current.position.y = initialPos.y + Math.cos(t * speed) * 0.5
    group.current.position.z = initialPos.z + Math.cos(t * speed) * 2 + Math.sin(t * speed * 2) * 1
    
    group.current.rotation.y = Math.sin(t * speed)

    // Kanat çırpma (daha hızlı)
    leftWing.current.rotation.z = Math.sin(t * 20) * 1
    rightWing.current.rotation.z = -Math.sin(t * 20) * 1
  })

  return (
    <group ref={group} position={position} scale={0.3}>
      <mesh ref={leftWing} position={[0.2, 0, 0]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={rightWing} position={[-0.2, 0, 0]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
