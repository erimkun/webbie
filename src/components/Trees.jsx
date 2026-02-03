import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Sabit sahne için tohumlu rastgele sayı üretici
const createRandom = (seed) => {
  let state = seed % 233280;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
};

export default function Trees() {
  const treePositions = useMemo(() => {
    const positions = []
    const rng = createRandom(42) // Sabit seed

    // Zemin yüksekliğini hesapla
    const getTerrainHeight = (x, z) => {
      const terrainY = -2
      let height = -0.5 // Base circle -0.5 (local)
      
      // Tepeler (Terrain.jsx'daki veriler)
      const hills = [
        { pos: [0, -2, 45], scale: [60, 8, 30] },
        { pos: [-25, -3, 10], scale: [30, 5, 30] },
        { pos: [30, -1, 15], scale: [35, 7, 35] },
        { pos: [40, 0, -10], scale: [30, 8, 30] },
        { pos: [-5, -1, 20], scale: [25, 3, 20] },
        { pos: [0, -1.5, 0], scale: [20, 2, 30] },
        { pos: [10, -1, -20], scale: [25, 4, 25] },
        { pos: [-15, -0.5, -30], scale: [20, 3, 20] }
      ]

      hills.forEach(hill => {
        // Elipsoid denklemi ile yükseklik hesabı
        // (x-x0)^2/a^2 + (y-y0)^2/b^2 + (z-z0)^2/c^2 = 1
        const xTerm = Math.pow(x - hill.pos[0], 2) / Math.pow(hill.scale[0], 2)
        const zTerm = Math.pow(z - hill.pos[2], 2) / Math.pow(hill.scale[2], 2)
        
        if (xTerm + zTerm < 1) {
          // Elipsoid içinde ise y'yi çöz
          // y = y0 + b * sqrt(1 - xTerm - zTerm)
          const localY = hill.pos[1] + hill.scale[1] * Math.sqrt(1 - xTerm - zTerm)
          if (localY > height) height = localY
        }
      })
      
      return height + terrainY
    }

    // Çarpışma kontrolü
    const isColliding = (checkPos, radius, existingPositions) => {
      for (let pos of existingPositions) {
        const dx = checkPos[0] - pos.position[0]
        const dz = checkPos[2] - pos.position[2]
        const dist = Math.sqrt(dx * dx + dz * dz)
        // İki ağacın yarıçapları toplamından azsa çarpışma var
        // Basitlik için her ağaca ortalama bir "gövde alanı" veriyoruz
        const otherRadius = pos.collisionRadius || 2
        if (dist < (radius + otherRadius)) return true
      }
      return false
    }

    const addTree = (type, x, z, scale, rotation, extra = {}) => {
      const collisionRadius = type === 'palm' ? 3 : (type === 'pine' ? 2.5 : 4)
      const checkPos = [x, 0, z]
      
      if (!isColliding(checkPos, collisionRadius, positions)) {
        const y = getTerrainHeight(x, z)
        positions.push({
          type,
          position: [x, y, z],
          scale,
          rotation,
          collisionRadius,
          seed: Math.floor(rng() * 100000), // Alt bileşenler için seed
          ...extra
        })
        return true
      }
      return false
    }

    // Palmiye ağaçları (sahil kenarı - sol taraf boyunca uzanan)
    const palmPositions = [
      // Sahil şeridi boyunca önden arkaya
      [-25, 40], [-28, 32], [-32, 25], 
      [-27, 18], [-35, 12], [-30, 5], 
      [-38, 0], [-33, -8], [-40, -15],
      [-35, -22], [-42, -30], [-26, 10], 
      [-31, 20], [-29, -3]
    ]
    palmPositions.forEach((pos) => {
      addTree('palm', pos[0], pos[1], 1.0 + rng() * 0.5, rng() * Math.PI * 2, {
        lean: 0.1 + rng() * 0.2
      })
    })
    
    // Çam ağaçları (arka planda yoğun kümelenmiş ve sivri tepeler)
    const pineZones = [
      { center: [0, -50], count: 8, radius: 12 },   // Merkez en arka
      { center: [15, -42], count: 6, radius: 8 },   // Sağ arka
      { center: [-15, -45], count: 6, radius: 8 },  // Sol arka
      { center: [30, -35], count: 4, radius: 6 },   // Sağ taraf arka
      { center: [-5, -38], count: 5, radius: 7 },   // Merkez arka
      { center: [10, -28], count: 3, radius: 4 }    // Orta alan karışık
    ]
    pineZones.forEach(zone => {
      let attempts = 0
      let placed = 0
      while (placed < zone.count && attempts < zone.count * 5) {
        attempts++
        const angle = rng() * Math.PI * 2
        const r = rng() * zone.radius
        const x = zone.center[0] + Math.cos(angle) * r
        const z = zone.center[1] + Math.sin(angle) * r
        
        if(addTree('pine', x, z, 0.9 + rng() * 0.7, rng() * Math.PI * 2)) {
          placed++
        }
      }
    })
    
    // Yaprak döken ağaçlar (yuvarlak taçlı - gruplar halinde)
    // Özel büyük ağaçlar
    addTree('deciduous', 32, 35, 1.6, rng() * Math.PI * 2, { variant: 1 })
    addTree('deciduous', 45, 20, 1.4, rng() * Math.PI * 2, { variant: 0 })

    const deciduousZones = [
      // Sağ tarafı domine eden gruplar
      { center: [35, 15], count: 4, radius: 8 },
      { center: [42, -5], count: 3, radius: 6 },
      { center: [28, -10], count: 4, radius: 7 },
      // Orta alan
      { center: [5, -20], count: 3, radius: 6 },
      { center: [-8, -15], count: 3, radius: 5 },
      // Sol iç kısım
      { center: [-18, -5], count: 2, radius: 4 },
      { center: [18, -5], count: 2, radius: 4 }
    ]

    deciduousZones.forEach(zone => {
      let attempts = 0
      let placed = 0
      while (placed < zone.count && attempts < zone.count * 5) {
        attempts++
        const angle = rng() * Math.PI * 2
        const r = rng() * zone.radius
        const x = zone.center[0] + Math.cos(angle) * r
        const z = zone.center[1] + Math.sin(angle) * r
        
        if(addTree('deciduous', x, z, 0.9 + rng() * 0.6, rng() * Math.PI * 2, { 
          variant: Math.floor(rng() * 3) 
        })) {
          placed++
        }
      }
    })
    
    return positions
  }, [])

  return (
    <group>
      {treePositions.map((tree, i) => {
        if (tree.type === 'palm') {
          return <PalmTree key={i} {...tree} />
        } else if (tree.type === 'pine') {
          return <PineTree key={i} {...tree} />
        } else {
          return <DeciduousTree key={i} {...tree} />
        }
      })}
    </group>
  )
}

// Palmiye ağacı - Resimdeki gibi gerçekçi
function PalmTree({ position, scale, rotation, lean = 0.1, seed = 0 }) {
  const groupRef = useRef()
  const leavesRef = useRef()
  const rng = useMemo(() => createRandom(seed), [seed])
  
  // Yaprak konfigürasyonunu memo yapalım ki sabit kalsın
  const leafConfig = useMemo(() => {
    const leafRng = createRandom(seed);
    const leaves = [];
    // Ana yapraklar
    for(let i=0; i<8; i++) {
        leaves.push({
            type: 'main',
            angle: (i / 8) * Math.PI * 2,
            droopAngle: 0.5 + leafRng() * 0.4,
            leafLength: 5 + leafRng() * 1.5,
            idx: i
        })
    }
    // Üst yapraklar
    for(let i=0; i<4; i++) {
        leaves.push({
            type: 'top',
            angle: (i / 4) * Math.PI * 2 + Math.PI / 8,
            idx: i
        })
    }
    return leaves;
  }, [seed])

  useFrame((state) => {
    if (leavesRef.current) {
      // Hafif sallanma efekti - sadece yapraklar
      leavesRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8 + rotation) * 0.03
      leavesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.6 + rotation) * 0.02
    }
  })

  // Gövde için eğri path
  const trunkCurve = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(lean * 2, 3, lean),
      new THREE.Vector3(lean * 3, 6, lean * 1.5),
      new THREE.Vector3(lean * 2.5, 9, lean * 1.2),
    ])
    return curve
  }, [lean])

  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Eğri gövde */}
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[trunkCurve, 20, 0.25, 8, false]} />
        <meshStandardMaterial color="#8B7355" roughness={0.95} />
      </mesh>
      
      {/* Gövde halkaları */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
        const t = i / 9
        const point = trunkCurve.getPoint(t)
        return (
          <mesh key={i} position={[point.x, point.y, point.z]} castShadow>
            <torusGeometry args={[0.28, 0.05, 6, 12]} />
            <meshStandardMaterial color="#6B5344" roughness={0.9} />
          </mesh>
        )
      })}
      
      {/* Yaprak grubu */}
      <group ref={leavesRef} position={[lean * 2.5, 9, lean * 1.2]}>
        {/* Ana yapraklar - büyük ve belirgin palmiye yaprakları */}
        {leafConfig.filter(l => l.type === 'main').map((leaf, i) => {
          return (
            <group key={`main-${i}`} rotation={[leaf.droopAngle, leaf.angle, 0]}>
              {/* Ana yaprak dalı */}
              <mesh position={[0, 0, leaf.leafLength / 2]} castShadow>
                <boxGeometry args={[0.12, 0.06, leaf.leafLength]} />
                <meshStandardMaterial color="#2d5a1e" roughness={0.7} />
              </mesh>
              {/* Yaprak segmentleri - daha büyük ve belirgin */}
              {[...Array(14)].map((_, j) => (
                <mesh
                  key={j}
                  position={[
                    (j % 2 === 0 ? 0.6 : -0.6),
                    0,
                    0.8 + j * 0.35
                  ]}
                  rotation={[0, 0, (j % 2 === 0 ? 0.4 : -0.4)]}
                  castShadow
                >
                  <boxGeometry args={[0.9, 0.03, 0.2]} />
                  <meshStandardMaterial color="#4a9a3e" roughness={0.6} />
                </mesh>
              ))}
            </group>
          )
        })}
        
        {/* Üst yapraklar - dik duran */}
        {leafConfig.filter(l => l.type === 'top').map((leaf, i) => {
          return (
            <group key={`top-${i}`} rotation={[0.2, leaf.angle, 0]}>
              <mesh position={[0, 0, 2]} castShadow>
                <boxGeometry args={[0.1, 0.05, 4]} />
                <meshStandardMaterial color="#3d7a2e" roughness={0.7} />
              </mesh>
              {[...Array(10)].map((_, j) => (
                <mesh
                  key={j}
                  position={[
                    (j % 2 === 0 ? 0.5 : -0.5),
                    0,
                    0.5 + j * 0.35
                  ]}
                  rotation={[0, 0, (j % 2 === 0 ? 0.35 : -0.35)]}
                  castShadow
                >
                  <boxGeometry args={[0.7, 0.025, 0.18]} />
                  <meshStandardMaterial color="#5aaa4e" roughness={0.6} />
                </mesh>
              ))}
            </group>
          )
        })}
        
        {/* Merkez - tomurcuk alanı */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.5, 8, 6]} />
          <meshStandardMaterial color="#4a8a3a" roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
}

// Çam ağacı - Resimdeki gibi koyu ve sivri
function PineTree({ position, scale, rotation }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Gövde */}
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.35, 4, 8]} />
        <meshStandardMaterial color="#3d2817" roughness={0.95} />
      </mesh>
      
      {/* Yaprak katmanları - daha koyu ve yoğun */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[2.5, 3.5, 8]} />
        <meshStandardMaterial color="#1a3d1f" roughness={0.85} />
      </mesh>
      <mesh position={[0, 5.5, 0]} castShadow>
        <coneGeometry args={[2, 3, 8]} />
        <meshStandardMaterial color="#1e4a24" roughness={0.85} />
      </mesh>
      <mesh position={[0, 7.2, 0]} castShadow>
        <coneGeometry args={[1.4, 2.5, 8]} />
        <meshStandardMaterial color="#235a2a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 8.6, 0]} castShadow>
        <coneGeometry args={[0.8, 2, 8]} />
        <meshStandardMaterial color="#2a6a32" roughness={0.85} />
      </mesh>
      <mesh position={[0, 9.7, 0]} castShadow>
        <coneGeometry args={[0.4, 1.2, 6]} />
        <meshStandardMaterial color="#2d7a35" roughness={0.85} />
      </mesh>
    </group>
  )
}

// Yaprak döken ağaç - Resimdeki gibi dolgun yuvarlak taç
function DeciduousTree({ position, scale, rotation, variant = 0 }) {
  const colors = useMemo(() => {
    const colorSets = [
      { main: '#2d8a3a', light: '#3d9a4a', dark: '#1d7a2a' },
      { main: '#3a9a45', light: '#4aaa55', dark: '#2a8a35' },
      { main: '#35954a', light: '#45a55a', dark: '#25853a' }
    ]
    return colorSets[variant % colorSets.length]
  }, [variant])

  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Gövde - kahverengi */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.5, 5, 8]} />
        <meshStandardMaterial color="#5a4030" roughness={0.95} />
      </mesh>
      
      {/* Alt dallar (görünür) */}
      <mesh position={[0.8, 3.5, 0]} rotation={[0, 0, -0.5]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 1.5, 6]} />
        <meshStandardMaterial color="#5a4030" roughness={0.95} />
      </mesh>
      <mesh position={[-0.6, 3.8, 0.3]} rotation={[0.3, 0, 0.4]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.2, 6]} />
        <meshStandardMaterial color="#5a4030" roughness={0.95} />
      </mesh>
      
      {/* Ana yaprak taçı - büyük ve yuvarlak */}
      <mesh position={[0, 6.5, 0]} castShadow>
        <sphereGeometry args={[3.5, 16, 14]} />
        <meshStandardMaterial color={colors.main} roughness={0.75} />
      </mesh>
      
      {/* Üst taç - daha açık */}
      <mesh position={[0, 8, 0]} castShadow>
        <sphereGeometry args={[2.5, 14, 12]} />
        <meshStandardMaterial color={colors.light} roughness={0.75} />
      </mesh>
      
      {/* Yan taç kümeleri - dolgunluk için */}
      <mesh position={[2, 5.5, 0.5]} castShadow>
        <sphereGeometry args={[2, 12, 10]} />
        <meshStandardMaterial color={colors.main} roughness={0.75} />
      </mesh>
      <mesh position={[-1.8, 5.8, -0.8]} castShadow>
        <sphereGeometry args={[2.2, 12, 10]} />
        <meshStandardMaterial color={colors.dark} roughness={0.75} />
      </mesh>
      <mesh position={[0.5, 5.2, -1.5]} castShadow>
        <sphereGeometry args={[1.8, 12, 10]} />
        <meshStandardMaterial color={colors.main} roughness={0.75} />
      </mesh>
      <mesh position={[-0.8, 5, 1.8]} castShadow>
        <sphereGeometry args={[1.9, 12, 10]} />
        <meshStandardMaterial color={colors.light} roughness={0.75} />
      </mesh>
      <mesh position={[1.5, 6.8, -0.5]} castShadow>
        <sphereGeometry args={[1.5, 10, 8]} />
        <meshStandardMaterial color={colors.light} roughness={0.75} />
      </mesh>
      
      {/* Gölge için alt detay */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <sphereGeometry args={[2.8, 12, 10]} />
        <meshStandardMaterial color={colors.dark} roughness={0.8} />
      </mesh>
    </group>
  )
}
