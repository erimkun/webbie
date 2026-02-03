import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Html } from '@react-three/drei'
import { Suspense, useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import * as THREE from 'three'

// Tıklanabilir Bone
function ClickableBone({ bone, isSelected, onClick, color = '#ffff00' }) {
  const meshRef = useRef()
  const [pos, setPos] = useState([0, 0, 0])
  
  useFrame(() => {
    const p = new THREE.Vector3()
    bone.getWorldPosition(p)
    setPos([p.x, p.y, p.z])
  })
  
  return (
    <mesh
      ref={meshRef}
      position={pos}
      onClick={(e) => {
        e.stopPropagation()
        onClick(bone)
      }}
    >
      <sphereGeometry args={[isSelected ? 0.04 : 0.025, 12, 12]} />
      <meshBasicMaterial 
        color={isSelected ? '#00ff00' : color} 
        transparent 
        opacity={isSelected ? 1 : 0.8}
      />
      {isSelected && (
        <Html distanceFactor={10}>
          <div style={{
            background: '#00ff00',
            color: '#000',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            fontWeight: 'bold'
          }}>
            {bone.name}
          </div>
        </Html>
      )}
    </mesh>
  )
}

// Karakter modeli
function EditableCharacter({ 
  onBonesLoaded,
  selectedBone,
  onBoneSelect,
  externalAnimation,
  isPlaying,
  currentFrame,
  totalFrames,
  showSkeleton,
  showBones,
  characterScale = 1
}) {
  const group = useRef()
  const skeletonHelperRef = useRef()
  const mixerRef = useRef()
  const actionRef = useRef()
  const { scene } = useGLTF('/ErimChar.glb')
  const [bones, setBones] = useState([])
  
  // SkeletonUtils.clone kullan - normal clone SkinnedMesh'i bozuyor
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene])
  
  // Bone'ları bul
  useEffect(() => {
    const foundBones = []
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
      if (child.isBone) {
        foundBones.push(child)
        
        // Bone isimlerini normalize et (suffix'i kaldır) - animasyon için
        // LeftUpLeg_057 -> LeftUpLeg olarak da erişilebilir yap
        const baseName = child.name.replace(/_\d+$/, '')
        if (baseName !== child.name) {
          // Eğer parent varsa, parent'a da bu isimle bir referans ekle
          if (child.parent) {
            child.parent[baseName] = child
          }
          // Scene'e de ekle
          clonedScene[baseName] = child
        }
      }
    })
    
    setBones(foundBones)
    onBonesLoaded && onBonesLoaded(foundBones)
    
    // Bone isimlerini logla
    console.log('=== GLB Bone İsimleri ===')
    foundBones.slice(0, 10).forEach((b, i) => {
      console.log(`${i}: ${b.name} -> base: ${b.name.replace(/_\d+$/, '')}`)
    })
    
    // Mixer oluştur
    mixerRef.current = new THREE.AnimationMixer(clonedScene)
    
  }, [clonedScene, onBonesLoaded])
  
  // Skeleton Helper
  useEffect(() => {
    if (showSkeleton && clonedScene) {
      if (skeletonHelperRef.current) {
        clonedScene.remove(skeletonHelperRef.current)
      }
      const helper = new THREE.SkeletonHelper(clonedScene)
      helper.material.linewidth = 2
      helper.material.depthTest = false
      skeletonHelperRef.current = helper
      clonedScene.add(helper)
    } else if (skeletonHelperRef.current) {
      clonedScene.remove(skeletonHelperRef.current)
      skeletonHelperRef.current = null
    }
    
    return () => {
      if (skeletonHelperRef.current && clonedScene) {
        clonedScene.remove(skeletonHelperRef.current)
      }
    }
  }, [showSkeleton, clonedScene])
  
  // External animasyon yüklendiğinde
  useEffect(() => {
    if (externalAnimation && mixerRef.current) {
      // Önceki action'ı durdur
      if (actionRef.current) {
        actionRef.current.stop()
      }
      
      console.log('Animasyon yükleniyor:', externalAnimation.name)
      console.log('Animasyon track sayısı:', externalAnimation.tracks.length)
      
      // Track isimlerini logla
      externalAnimation.tracks.forEach((track, i) => {
        if (i < 5) console.log(`Track ${i}: ${track.name}`)
      })
      
      const action = mixerRef.current.clipAction(externalAnimation)
      action.setLoop(THREE.LoopRepeat)
      action.clampWhenFinished = false
      action.play()
      actionRef.current = action
      
      console.log('Animasyon başlatıldı')
    }
  }, [externalAnimation])
  
  // Frame kontrolü (oynatma durduğunda)
  useEffect(() => {
    if (externalAnimation && mixerRef.current && !isPlaying && currentFrame !== undefined) {
      const time = (currentFrame / totalFrames) * externalAnimation.duration
      mixerRef.current.setTime(time)
    }
  }, [currentFrame, externalAnimation, isPlaying, totalFrames])
  
  useFrame((state, delta) => {
    if (mixerRef.current && isPlaying && externalAnimation) {
      mixerRef.current.update(delta)
    }
  })
  
  return (
    <group ref={group} scale={characterScale}>
      <primitive object={clonedScene} />
      
      {/* Tıklanabilir bone noktaları */}
      {showBones && bones.map((bone, index) => (
        <ClickableBone
          key={index}
          bone={bone}
          isSelected={selectedBone?.name === bone.name}
          onClick={onBoneSelect}
        />
      ))}
    </group>
  )
}

export default function AnimationEditor() {
  // Bone'lar
  const [bones, setBones] = useState([])
  const [selectedBone, setSelectedBone] = useState(null)
  
  // Timeline
  const [currentFrame, setCurrentFrame] = useState(0)
  const [totalFrames, setTotalFrames] = useState(60)
  const [isPlaying, setIsPlaying] = useState(false)
  const [fps, setFps] = useState(30)
  
  // Görselleştirme
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [showBones, setShowBones] = useState(true)
  const [characterScale, setCharacterScale] = useState(1)
  
  // Yüklenen animasyonlar
  const [loadedAnimations, setLoadedAnimations] = useState([])
  const [selectedAnimation, setSelectedAnimation] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Hazır animasyonlar listesi
  const [presetAnimations, setPresetAnimations] = useState([
    { name: 'Golf Vuruşu', file: '/GolfVurusu.fbx', loaded: false }
  ])
  
  const playIntervalRef = useRef(null)
  const fileInputRef = useRef(null)

  // Bone isim eşleştirme tablosu (runtime'da doldurulacak)
  const boneNameMap = useRef({})
  
  // Bone listesi geldiğinde eşleştirme tablosunu oluştur
  useEffect(() => {
    if (bones.length > 0) {
      const map = {}
      bones.forEach(bone => {
        // LeftUpLeg_057 -> LeftUpLeg eşleştirmesi
        const baseName = bone.name.replace(/_\d+$/, '')
        map[baseName] = bone.name
      })
      boneNameMap.current = map
      console.log('Bone eşleştirme tablosu:', Object.keys(map).slice(0, 10))
    }
  }, [bones])

  // Mixamo track isimlerini GLB bone isimlerine çevir
  const retargetAnimation = useCallback((clip) => {
    clip.tracks.forEach(track => {
      // "mixamorig:" prefix'ini kaldır
      let newName = track.name.replace(/mixamorig:/g, '')
      newName = newName.replace(/mixamorig/g, '')
      
      // Track formatı: BoneName.property (örn: LeftUpLeg.quaternion)
      const parts = newName.split('.')
      if (parts.length >= 2) {
        const boneName = parts[0]
        const property = parts.slice(1).join('.')
        
        // Eşleştirme tablosunda varsa değiştir
        if (boneNameMap.current[boneName]) {
          newName = `${boneNameMap.current[boneName]}.${property}`
        }
      }
      
      track.name = newName
    })
    return clip
  }, [])

  // FBX'ten animasyon yükle
  const loadAnimationFromFBX = useCallback(async (url, name) => {
    // Bone listesi hazır değilse bekle
    if (Object.keys(boneNameMap.current).length === 0) {
      console.log('⏳ Bone listesi bekleniyor...')
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsLoading(true)
    
    try {
      const loader = new FBXLoader()
      const fbx = await new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject)
      })
      
      if (fbx.animations && fbx.animations.length > 0) {
        let clip = fbx.animations[0]
        clip.name = name
        
        // Mixamo → GLB bone isimlerini düzelt
        clip = retargetAnimation(clip)
        
        console.log('Düzeltilmiş track isimleri:')
        clip.tracks.slice(0, 5).forEach((t, i) => console.log(`${i}: ${t.name}`))
        
        setLoadedAnimations(prev => [...prev, { name, clip }])
        setSelectedAnimation(clip)
        setTotalFrames(Math.floor(clip.duration * fps))
        
        console.log('✅ Animasyon yüklendi:', name, 'Süre:', clip.duration.toFixed(2) + 's')
        return clip
      } else {
        throw new Error('FBX dosyasında animasyon bulunamadı')
      }
    } catch (error) {
      console.error('Animasyon yükleme hatası:', error)
      alert('Animasyon yüklenemedi: ' + error.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fps, retargetAnimation])
  
  // Hazır animasyon yükle
  const loadPresetAnimation = useCallback(async (preset) => {
    // Zaten yüklüyse seç
    const existing = loadedAnimations.find(a => a.name === preset.name)
    if (existing) {
      setSelectedAnimation(existing.clip)
      setTotalFrames(Math.floor(existing.clip.duration * fps))
      return
    }
    
    await loadAnimationFromFBX(preset.file, preset.name)
    
    // Preset'i güncelle
    setPresetAnimations(prev => 
      prev.map(p => p.name === preset.name ? { ...p, loaded: true } : p)
    )
  }, [loadAnimationFromFBX, loadedAnimations, fps])
  
  // Dosyadan animasyon yükle
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const url = URL.createObjectURL(file)
    const name = file.name.replace(/\.(fbx|glb|gltf)$/i, '')
    
    await loadAnimationFromFBX(url, name)
    URL.revokeObjectURL(url)
    
    event.target.value = ''
  }, [loadAnimationFromFBX])
  
  // Playback
  useEffect(() => {
    if (isPlaying && selectedAnimation) {
      playIntervalRef.current = setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= totalFrames - 1) return 0
          return prev + 1
        })
      }, 1000 / fps)
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
    
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [isPlaying, fps, totalFrames, selectedAnimation])

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex',
      background: '#1a1a2e',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Sol Panel */}
      <div style={{ 
        width: '320px', 
        background: '#16213e',
        borderRight: '1px solid #0f3460',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Başlık */}
        <div style={{ 
          padding: '20px',
          borderBottom: '1px solid #0f3460',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            🎬 Animasyon Editörü
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: '12px', opacity: 0.8 }}>
            Hazır animasyonları yükle ve oynat
          </p>
        </div>
        
        {/* Hazır Animasyonlar */}
        <div style={{ padding: '15px', borderBottom: '1px solid #0f3460' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#64ffda' }}>
            📦 Hazır Animasyonlar
          </h3>
          
          {presetAnimations.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => loadPresetAnimation(preset)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '8px',
                background: selectedAnimation?.name === preset.name 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#0f3460',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span>{preset.loaded ? '✅' : '📥'}</span>
              <span>{preset.name}</span>
            </button>
          ))}
          
          {/* Dosya yükle */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              border: '2px dashed #0f3460',
              borderRadius: '6px',
              color: '#888',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            ➕ FBX Animasyon Ekle
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".fbx"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
        
        {/* Yüklenen Animasyonlar */}
        {loadedAnimations.length > 0 && (
          <div style={{ padding: '15px', borderBottom: '1px solid #0f3460' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#64ffda' }}>
              🎞️ Yüklenen Animasyonlar
            </h3>
            
            {loadedAnimations.map((anim, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedAnimation(anim.clip)
                  setTotalFrames(Math.floor(anim.clip.duration * fps))
                  setCurrentFrame(0)
                }}
                style={{
                  padding: '10px',
                  marginBottom: '5px',
                  background: selectedAnimation?.name === anim.name ? '#764ba2' : '#0f3460',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{anim.name}</div>
                <div style={{ color: '#888', fontSize: '11px' }}>
                  {anim.clip.duration.toFixed(2)}s
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Görüntü Ayarları */}
        <div style={{ padding: '15px', borderBottom: '1px solid #0f3460' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#64ffda' }}>
            👁️ Görüntü Ayarları
          </h3>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            marginBottom: '10px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={showSkeleton}
              onChange={(e) => setShowSkeleton(e.target.checked)}
            />
            <span style={{ fontSize: '13px' }}>İskeleti Göster</span>
          </label>
          
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            marginBottom: '10px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={showBones}
              onChange={(e) => setShowBones(e.target.checked)}
            />
            <span style={{ fontSize: '13px' }}>Bone Noktaları</span>
          </label>
          
          <div>
            <label style={{ fontSize: '12px', color: '#aaa' }}>
              Ölçek: {characterScale.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={characterScale}
              onChange={(e) => setCharacterScale(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#667eea' }}
            />
          </div>
        </div>
        
        {/* Seçili Bone */}
        <div style={{ 
          flex: 1, 
          padding: '15px',
          overflow: 'auto'
        }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#64ffda' }}>
            🦴 Bone'lar ({bones.length})
          </h3>
          
          {selectedBone ? (
            <div style={{ 
              padding: '10px',
              background: '#0f3460',
              borderRadius: '6px',
              marginBottom: '10px'
            }}>
              <div style={{ fontWeight: 'bold', color: '#00ff00', marginBottom: '5px' }}>
                Seçili: {selectedBone.name}
              </div>
              <div style={{ fontSize: '11px', color: '#888' }}>
                Pos: ({selectedBone.position.x.toFixed(2)}, {selectedBone.position.y.toFixed(2)}, {selectedBone.position.z.toFixed(2)})
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '15px',
              background: '#0f3460',
              borderRadius: '6px',
              textAlign: 'center',
              color: '#888',
              fontSize: '12px'
            }}>
              👆 Sahnede bir bone'a tıklayın
            </div>
          )}
          
          <div style={{ 
            maxHeight: '200px',
            overflowY: 'auto',
            background: '#0f3460',
            borderRadius: '6px',
            padding: '5px'
          }}>
            {bones.map((bone, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedBone(bone)}
                style={{
                  padding: '6px 10px',
                  marginBottom: '2px',
                  background: selectedBone?.name === bone.name ? '#764ba2' : 'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                {bone.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Orta - 3D Sahne */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 3D Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Canvas
            camera={{ position: [0, 1.5, 3], fov: 50 }}
            style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <directionalLight position={[-5, 5, -5]} intensity={0.5} />
            
            <gridHelper args={[10, 10, '#333', '#222']} />
            
            <Suspense fallback={null}>
              <EditableCharacter
                onBonesLoaded={setBones}
                selectedBone={selectedBone}
                onBoneSelect={setSelectedBone}
                externalAnimation={selectedAnimation}
                isPlaying={isPlaying}
                currentFrame={currentFrame}
                totalFrames={totalFrames}
                showSkeleton={showSkeleton}
                showBones={showBones}
                characterScale={characterScale}
              />
              
              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                target={[0, 1, 0]}
              />
            </Suspense>
          </Canvas>
          
          {/* Loading */}
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0,0,0,0.8)',
              padding: '20px 40px',
              borderRadius: '10px',
              fontSize: '16px'
            }}>
              ⏳ Yükleniyor...
            </div>
          )}
          
          {/* Frame göstergesi */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(0,0,0,0.7)',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '24px',
            fontWeight: 'bold',
            fontFamily: 'monospace'
          }}>
            {String(currentFrame).padStart(3, '0')} / {totalFrames}
          </div>
          
          {/* Animasyon bilgisi */}
          {selectedAnimation && (
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(0,0,0,0.7)',
              padding: '10px 15px',
              borderRadius: '8px',
              fontSize: '12px'
            }}>
              <div style={{ fontWeight: 'bold', color: '#64ffda' }}>
                {selectedAnimation.name}
              </div>
              <div style={{ color: '#888' }}>
                {selectedAnimation.duration.toFixed(2)}s | {fps} FPS
              </div>
            </div>
          )}
        </div>
        
        {/* Timeline */}
        <div style={{ 
          height: '120px',
          background: '#0f3460',
          borderTop: '1px solid #1a1a2e',
          padding: '10px 20px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Kontroller */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            marginBottom: '10px'
          }}>
            <button
              onClick={() => setCurrentFrame(0)}
              style={{
                padding: '8px 12px',
                background: '#16213e',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ⏮️
            </button>
            
            <button
              onClick={() => setCurrentFrame(Math.max(0, currentFrame - 1))}
              style={{
                padding: '8px 12px',
                background: '#16213e',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ◀️
            </button>
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!selectedAnimation}
              style={{
                padding: '8px 20px',
                background: !selectedAnimation ? '#555' : (isPlaying ? '#e74c3c' : '#00b894'),
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: selectedAnimation ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {isPlaying ? '⏸️ Durdur' : '▶️ Oynat'}
            </button>
            
            <button
              onClick={() => setCurrentFrame(Math.min(totalFrames - 1, currentFrame + 1))}
              style={{
                padding: '8px 12px',
                background: '#16213e',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ▶️
            </button>
            
            <button
              onClick={() => setCurrentFrame(totalFrames - 1)}
              style={{
                padding: '8px 12px',
                background: '#16213e',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ⏭️
            </button>
            
            <div style={{ flex: 1 }} />
            
            <span style={{ fontSize: '12px', color: '#888' }}>
              {selectedAnimation ? (currentFrame / fps).toFixed(2) : '0.00'}s
            </span>
          </div>
          
          {/* Timeline slider */}
          <div style={{ flex: 1 }}>
            <input
              type="range"
              min="0"
              max={totalFrames - 1}
              value={currentFrame}
              onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
              disabled={!selectedAnimation}
              style={{ 
                width: '100%', 
                height: '20px',
                accentColor: '#667eea'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
