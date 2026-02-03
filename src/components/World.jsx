import { useMemo } from 'react'

export default function World() {
  return (
    <group>
      {/* Zemin disk - ana platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <circleGeometry args={[55, 64]} />
        <meshStandardMaterial color="#1a3d16" roughness={0.9} />
      </mesh>
    </group>
  )
}
