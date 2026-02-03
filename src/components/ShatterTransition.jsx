import { useRef, useMemo, useContext } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ScrollContext } from '../App'

// Ekran kırılma efekti - bobbyroe/explode-transition tarzı
export default function ShatterTransition() {
  const { camera, gl, scene, size } = useThree()
  const groupRef = useRef()
  const wallRef = useRef()
  const { progress } = useContext(ScrollContext)
  
  // Refs
  const textureRef = useRef(null)
  const chunksRef = useRef([])
  const isExplodingRef = useRef(false)
  const hasTextureRef = useRef(false)
  
  // Kırılma başlangıç eşiği - patlama ile aynı anda
  const shatterStart = 0.89
  
  // Ekran boyutları
  const aspect = size.width / size.height
  const planeHeight = 2.8
  const planeWidth = planeHeight * aspect
  
  // Parça verileri - sadece bir kez oluştur
  const chunkData = useMemo(() => {
    const cols = 8
    const rows = 6
    const pieces = []
    
    const pieceW = planeWidth / cols
    const pieceH = planeHeight / rows
    
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = (i - cols / 2 + 0.5) * pieceW
        const y = (j - rows / 2 + 0.5) * pieceH
        
        // Geometry with custom UVs
        const geo = new THREE.PlaneGeometry(pieceW * 1.02, pieceH * 1.02)
        const uvs = geo.attributes.uv
        
        const uMin = i / cols
        const uMax = (i + 1) / cols
        const vMin = 1 - (j + 1) / rows
        const vMax = 1 - j / rows
        
        uvs.setXY(0, uMin, vMax)
        uvs.setXY(1, uMax, vMax)
        uvs.setXY(2, uMin, vMin)
        uvs.setXY(3, uMax, vMin)
        
        pieces.push({
          geometry: geo,
          startPos: new THREE.Vector3(x, y, 0),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.03,
            (Math.random() - 0.5) * 0.03,
            0.01 + Math.random() * 0.02
          ),
          rotationRate: new THREE.Vector3(
            (Math.random() - 0.5) * 0.06,
            (Math.random() - 0.5) * 0.06,
            (Math.random() - 0.5) * 0.06
          ),
          // Runtime state
          currentPos: new THREE.Vector3(x, y, 0),
          currentRot: new THREE.Euler(0, 0, 0),
          currentVelZ: 0.01 + Math.random() * 0.02
        })
      }
    }
    return pieces
  }, [planeWidth, planeHeight])
  
  // Reset fonksiyonu
  const resetChunks = () => {
    chunkData.forEach((chunk, i) => {
      chunk.currentPos.copy(chunk.startPos)
      chunk.currentRot.set(0, 0, 0)
      chunk.currentVelZ = chunk.velocity.z
      
      if (chunksRef.current[i]) {
        chunksRef.current[i].position.copy(chunk.startPos)
        chunksRef.current[i].rotation.set(0, 0, 0)
        if (chunksRef.current[i].material) {
          chunksRef.current[i].material.opacity = 1
        }
      }
    })
    isExplodingRef.current = false
  }
  
  useFrame(() => {
    // Scroll geri gittiyse reset
    if (progress < 0.80 && hasTextureRef.current) {
      hasTextureRef.current = false
      textureRef.current = null
      resetChunks()
    }
    
    // Texture yakala - kırılmadan hemen önce (patlama anına çok yakın olsun ki donma hissedilmesin)
    // 0.88 - 0.89 arası capture için ideal
    if (progress >= 0.88 && progress < shatterStart && !hasTextureRef.current) {
      // Grubu gizle
      if (groupRef.current) groupRef.current.visible = false
      
      // Render target oluştur ve sahneyi çiz
      const renderTarget = new THREE.WebGLRenderTarget(
        Math.min(size.width, 1024),
        Math.min(size.height, 1024)
      )
      gl.setRenderTarget(renderTarget)
      gl.render(scene, camera)
      gl.setRenderTarget(null)
      
      textureRef.current = renderTarget.texture
      hasTextureRef.current = true
      
      // Chunk'lara texture uygula
      chunksRef.current.forEach(chunk => {
        if (chunk && chunk.material) {
          chunk.material.map = textureRef.current
          chunk.material.needsUpdate = true
        }
      })
      
      // Wall'a da uygula
      if (wallRef.current && wallRef.current.material) {
        wallRef.current.material.map = textureRef.current
        wallRef.current.material.needsUpdate = true
      }
      
      if (groupRef.current) groupRef.current.visible = true
    }
    
    // Grubu kameraya bağla
    if (groupRef.current) {
      const dir = new THREE.Vector3()
      camera.getWorldDirection(dir)
      groupRef.current.position.copy(camera.position).add(dir.multiplyScalar(2.5))
      groupRef.current.quaternion.copy(camera.quaternion)
    }
    
    // Kırılma başlasın mı?
    const shouldExplode = progress >= shatterStart && hasTextureRef.current
    
    // Wall görünürlüğü
    if (wallRef.current) {
      wallRef.current.visible = hasTextureRef.current && !shouldExplode
    }
    
    // Parçaları güncelle
    if (shouldExplode) {
      isExplodingRef.current = true
      const explosiveForce = 0.0015
      
      chunksRef.current.forEach((mesh, i) => {
        if (!mesh) return
        
        const chunk = chunkData[i]
        
        // Görünür yap
        mesh.visible = true
        
        // Z yönünde hızlan
        chunk.currentVelZ += explosiveForce
        
        // Pozisyon güncelle
        if (chunk.currentPos.z < 12) {
          chunk.currentPos.x += chunk.velocity.x
          chunk.currentPos.y += chunk.velocity.y
          chunk.currentPos.z += chunk.currentVelZ
          
          // Döndür
          chunk.currentRot.x += chunk.rotationRate.x
          chunk.currentRot.y += chunk.rotationRate.y
          chunk.currentRot.z += chunk.rotationRate.z
          
          // Mesh'e uygula
          mesh.position.copy(chunk.currentPos)
          mesh.rotation.copy(chunk.currentRot)
          
          // Opaklık - uzaklaştıkça kaybol
          if (mesh.material && chunk.currentPos.z > 4) {
            mesh.material.opacity = Math.max(0, 1 - (chunk.currentPos.z - 4) * 0.15)
          }
        } else {
          mesh.visible = false
        }
      })
    } else {
      // Kırılma öncesi - parçaları gizle
      chunksRef.current.forEach(mesh => {
        if (mesh) mesh.visible = false
      })
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Düz duvar - kırılma öncesi görünür */}
      <mesh ref={wallRef} visible={false}>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshBasicMaterial transparent side={THREE.DoubleSide} />
      </mesh>
      
      {/* Kırılmış parçalar */}
      {chunkData.map((chunk, i) => (
        <mesh
          key={i}
          ref={el => chunksRef.current[i] = el}
          geometry={chunk.geometry}
          position={chunk.startPos.toArray()}
          visible={false}
        >
          <meshBasicMaterial transparent side={THREE.DoubleSide} opacity={1} />
        </mesh>
      ))}
    </group>
  )
}
