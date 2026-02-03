import { useRef, useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, OrbitControls, TransformControls } from '@react-three/drei'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import * as THREE from 'three'

function CharacterWithClub({ 
  animationTime, 
  clubPosition, 
  clubRotation, 
  clubScale,
  onBoneFound,
  onClubTransformChange,
  transformMode,
  onDraggingChange
}) {
  const mixerRef = useRef()
  const actionRef = useRef()
  const clipRef = useRef()
  const handBoneRef = useRef(null)
  const clubRef = useRef(null)
  const clubGroupRef = useRef(null)
  const { scene } = useGLTF('/ErimChar.glb')
  const [animationLoaded, setAnimationLoaded] = useState(false)
  const [clubLoaded, setClubLoaded] = useState(false)
  
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const boneNameMap = useRef({})
  
  // Bone'ları bul
  useEffect(() => {
    const map = {}
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
      if (child.isBone) {
        const baseName = child.name.replace(/_\d+$/, '')
        map[baseName] = child.name
        
        if (baseName === 'RightHand') {
          handBoneRef.current = child
          onBoneFound && onBoneFound(child.name)
        }
      }
    })
    boneNameMap.current = map
    mixerRef.current = new THREE.AnimationMixer(clonedScene)
  }, [clonedScene])
  
  // FBX animasyonu yükle
  useEffect(() => {
    if (Object.keys(boneNameMap.current).length === 0) return
    
    const loader = new FBXLoader()
    loader.load('/GolfVurusu.fbx', (fbx) => {
      if (fbx.animations && fbx.animations.length > 0) {
        let clip = fbx.animations[0]
        
        clip.tracks.forEach(track => {
          let newName = track.name.replace(/mixamorig:/g, '').replace(/mixamorig/g, '')
          const parts = newName.split('.')
          if (parts.length >= 2) {
            const boneName = parts[0]
            const property = parts.slice(1).join('.')
            if (boneNameMap.current[boneName]) {
              newName = `${boneNameMap.current[boneName]}.${property}`
            }
          }
          track.name = newName
        })
        
        clipRef.current = clip
        
        if (mixerRef.current) {
          const action = mixerRef.current.clipAction(clip)
          action.setLoop(THREE.LoopOnce)
          action.clampWhenFinished = true
          action.play()
          actionRef.current = action
          setAnimationLoaded(true)
        }
      }
    })
  }, [])
  
  // Golf sopası yükle
  useEffect(() => {
    if (!handBoneRef.current) return
    
    const loader = new GLTFLoader()
    loader.load('/GolfClub.glb', (gltf) => {
      const club = gltf.scene
      clubRef.current = club
      
      // Club'ı bir group içine al (TransformControls için)
      const clubGroup = new THREE.Group()
      clubGroup.add(club)
      clubGroupRef.current = clubGroup
      
      handBoneRef.current.add(clubGroup)
      setClubLoaded(true)
    })
  }, [handBoneRef.current])
  
  // Club pozisyon/rotation güncelle (slider'dan)
  useEffect(() => {
    if (!clubGroupRef.current) return
    clubGroupRef.current.position.set(clubPosition.x, clubPosition.y, clubPosition.z)
    clubGroupRef.current.rotation.set(
      THREE.MathUtils.degToRad(clubRotation.x),
      THREE.MathUtils.degToRad(clubRotation.y),
      THREE.MathUtils.degToRad(clubRotation.z)
    )
    clubGroupRef.current.scale.set(clubScale, clubScale, clubScale)
  }, [clubPosition, clubRotation, clubScale])
  
  // Animasyon zamanını güncelle
  useFrame(() => {
    if (!mixerRef.current || !animationLoaded || !actionRef.current || !clipRef.current) return
    actionRef.current.time = animationTime * clipRef.current.duration
    mixerRef.current.update(0)
  })

  return (
    <>
      <group position={[0, 0, 0]} scale={0.01}>
        <primitive object={clonedScene} />
      </group>
      
      {/* TransformControls - club yüklendikten sonra göster */}
      {clubLoaded && clubGroupRef.current && (
        <TransformControls
          object={clubGroupRef.current}
          mode={transformMode}
          size={0.5}
          onMouseDown={() => onDraggingChange && onDraggingChange(true)}
          onMouseUp={() => onDraggingChange && onDraggingChange(false)}
          onObjectChange={() => {
            if (clubGroupRef.current) {
              onClubTransformChange({
                position: {
                  x: parseFloat(clubGroupRef.current.position.x.toFixed(2)),
                  y: parseFloat(clubGroupRef.current.position.y.toFixed(2)),
                  z: parseFloat(clubGroupRef.current.position.z.toFixed(2))
                },
                rotation: {
                  x: parseFloat(THREE.MathUtils.radToDeg(clubGroupRef.current.rotation.x).toFixed(1)),
                  y: parseFloat(THREE.MathUtils.radToDeg(clubGroupRef.current.rotation.y).toFixed(1)),
                  z: parseFloat(THREE.MathUtils.radToDeg(clubGroupRef.current.rotation.z).toFixed(1))
                },
                scale: parseFloat(clubGroupRef.current.scale.x.toFixed(1))
              })
            }
          }}
        />
      )}
    </>
  )
}

export default function GolfClubEditor() {
  const [animationTime, setAnimationTime] = useState(0)
  const [clubPosition, setClubPosition] = useState({ x: 0, y: 5, z: 0 })
  const [clubRotation, setClubRotation] = useState({ x: 0, y: 0, z: 90 })
  const [clubScale, setClubScale] = useState(100)
  const [boneName, setBoneName] = useState('')
  const [playing, setPlaying] = useState(false)
  const [transformMode, setTransformMode] = useState('translate') // translate, rotate, scale
  const [isDragging, setIsDragging] = useState(false) // Gizmo sürüklenirken kamerayı kilitle
  
  // Gizmo'dan gelen değişiklikleri al
  const handleClubTransformChange = (transform) => {
    setClubPosition(transform.position)
    setClubRotation(transform.rotation)
    setClubScale(transform.scale)
  }
  
  // Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'g') setTransformMode('translate')
      if (e.key.toLowerCase() === 'r') setTransformMode('rotate')
      if (e.key.toLowerCase() === 's') setTransformMode('scale')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // Auto play
  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => {
      setAnimationTime(t => {
        if (t >= 1) {
          setPlaying(false)
          return 1
        }
        return t + 0.01
      })
    }, 30)
    return () => clearInterval(interval)
  }, [playing])
  
  const copyCode = () => {
    const code = `// Golf sopası ayarları
club.position.set(${clubPosition.x}, ${clubPosition.y}, ${clubPosition.z})
club.rotation.set(
  THREE.MathUtils.degToRad(${clubRotation.x}),
  THREE.MathUtils.degToRad(${clubRotation.y}),
  THREE.MathUtils.degToRad(${clubRotation.z})
)
club.scale.set(${clubScale}, ${clubScale}, ${clubScale})`
    navigator.clipboard.writeText(code)
    alert('Kod kopyalandı!')
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* 3D Canvas */}
      <div style={{ flex: 1 }}>
        <Canvas
          shadows
          camera={{ position: [3, 2, 3], fov: 50 }}
        >
          <color attach="background" args={['#1a1a2e']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
          <gridHelper args={[10, 10]} />
          <axesHelper args={[2]} />
          
          <CharacterWithClub
            animationTime={animationTime}
            clubPosition={clubPosition}
            clubRotation={clubRotation}
            clubScale={clubScale}
            onBoneFound={setBoneName}
            onClubTransformChange={handleClubTransformChange}
            transformMode={transformMode}
            onDraggingChange={setIsDragging}
          />
          
          <OrbitControls enabled={!isDragging} />
        </Canvas>
      </div>
      
      {/* Kontrol Paneli */}
      <div style={{
        width: '350px',
        background: '#16213e',
        color: 'white',
        padding: '20px',
        overflowY: 'auto',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2 style={{ marginTop: 0 }}>🏌️ Golf Sopası Editörü</h2>
        
        {boneName && (
          <p style={{ fontSize: '12px', color: '#8be9fd' }}>
            El Bone: {boneName}
          </p>
        )}
        
        {/* Gizmo Mode */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#1a1a2e', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>🎯 Gizmo Modu</h3>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button 
              onClick={() => setTransformMode('translate')} 
              style={{ ...btnStyle, flex: 1, background: transformMode === 'translate' ? '#e94560' : '#0f3460' }}
            >
              📍 Taşı (G)
            </button>
            <button 
              onClick={() => setTransformMode('rotate')} 
              style={{ ...btnStyle, flex: 1, background: transformMode === 'rotate' ? '#e94560' : '#0f3460' }}
            >
              🔄 Döndür (R)
            </button>
            <button 
              onClick={() => setTransformMode('scale')} 
              style={{ ...btnStyle, flex: 1, background: transformMode === 'scale' ? '#e94560' : '#0f3460' }}
            >
              📏 Ölçek (S)
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#888', marginTop: '8px', marginBottom: 0 }}>
            Kısayollar: G = Taşı, R = Döndür, S = Ölçek
          </p>
        </div>
        
        {/* Timeline */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#1a1a2e', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>⏱️ Animasyon</h3>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={animationTime}
            onChange={(e) => setAnimationTime(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>{(animationTime * 100).toFixed(0)}%</span>
            <span>{(animationTime * 3.1).toFixed(2)}s</span>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button onClick={() => setAnimationTime(0)} style={btnStyle}>⏮️ Başa</button>
            <button onClick={() => setPlaying(!playing)} style={btnStyle}>
              {playing ? '⏸️ Durdur' : '▶️ Oynat'}
            </button>
            <button onClick={() => setAnimationTime(1)} style={btnStyle}>⏭️ Sona</button>
          </div>
        </div>
        
        {/* Position */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#1a1a2e', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>📍 Pozisyon</h3>
          
          <label>X: {clubPosition.x}</label>
          <input
            type="range"
            min="-50"
            max="50"
            step="0.5"
            value={clubPosition.x}
            onChange={(e) => setClubPosition(p => ({ ...p, x: parseFloat(e.target.value) }))}
            style={{ width: '100%' }}
          />
          
          <label>Y: {clubPosition.y}</label>
          <input
            type="range"
            min="-50"
            max="50"
            step="0.5"
            value={clubPosition.y}
            onChange={(e) => setClubPosition(p => ({ ...p, y: parseFloat(e.target.value) }))}
            style={{ width: '100%' }}
          />
          
          <label>Z: {clubPosition.z}</label>
          <input
            type="range"
            min="-50"
            max="50"
            step="0.5"
            value={clubPosition.z}
            onChange={(e) => setClubPosition(p => ({ ...p, z: parseFloat(e.target.value) }))}
            style={{ width: '100%' }}
          />
        </div>
        
        {/* Rotation */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#1a1a2e', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>🔄 Rotasyon (derece)</h3>
          
          <label>X: {clubRotation.x}°</label>
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={clubRotation.x}
            onChange={(e) => setClubRotation(r => ({ ...r, x: parseFloat(e.target.value) }))}
            style={{ width: '100%' }}
          />
          
          <label>Y: {clubRotation.y}°</label>
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={clubRotation.y}
            onChange={(e) => setClubRotation(r => ({ ...r, y: parseFloat(e.target.value) }))}
            style={{ width: '100%' }}
          />
          
          <label>Z: {clubRotation.z}°</label>
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={clubRotation.z}
            onChange={(e) => setClubRotation(r => ({ ...r, z: parseFloat(e.target.value) }))}
            style={{ width: '100%' }}
          />
        </div>
        
        {/* Scale */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#1a1a2e', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>📏 Ölçek</h3>
          <label>Scale: {clubScale}</label>
          <input
            type="range"
            min="0.1"
            max="500"
            step="0.1"
            value={clubScale}
            onChange={(e) => setClubScale(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
          <input
            type="number"
            min="0.1"
            max="500"
            step="0.1"
            value={clubScale}
            onChange={(e) => setClubScale(parseFloat(e.target.value) || 0.1)}
            style={{ width: '100%', marginTop: '5px', padding: '5px', borderRadius: '4px', border: 'none' }}
          />
        </div>
        
        {/* Kod Çıktısı */}
        <div style={{ padding: '15px', background: '#0f3460', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>📋 Kod</h3>
          <pre style={{ 
            fontSize: '11px', 
            background: '#1a1a2e', 
            padding: '10px', 
            borderRadius: '4px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
{`position: (${clubPosition.x}, ${clubPosition.y}, ${clubPosition.z})
rotation: (${clubRotation.x}°, ${clubRotation.y}°, ${clubRotation.z}°)
scale: ${clubScale}`}
          </pre>
          <button onClick={copyCode} style={{ ...btnStyle, width: '100%', marginTop: '10px' }}>
            📋 Kodu Kopyala
          </button>
        </div>
      </div>
    </div>
  )
}

const btnStyle = {
  padding: '8px 12px',
  background: '#0f3460',
  border: 'none',
  borderRadius: '4px',
  color: 'white',
  cursor: 'pointer',
  fontSize: '12px'
}
