import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useState, useRef, useCallback } from 'react'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import Character from '../components/Character'

const DEFAULT_ANIMATIONS = [
  { name: 'CharacterArmature|Idle', label: 'Idle (Boşta)' },
  { name: 'CharacterArmature|Idle_Neutral', label: 'Idle Neutral (Nötr)' },
  { name: 'CharacterArmature|Idle_Sword', label: 'Idle Sword (Kılıçlı)' },
  { name: 'CharacterArmature|Idle_Gun', label: 'Idle Gun (Silahlı)' },
  { name: 'CharacterArmature|Idle_Gun_Pointing', label: 'Gun Pointing (Nişan)' },
  { name: 'CharacterArmature|Idle_Gun_Shoot', label: 'Gun Shoot (Ateş)' },
  { name: 'CharacterArmature|Walk', label: 'Walk (Yürüme)' },
  { name: 'CharacterArmature|Run', label: 'Run (Koşma)' },
  { name: 'CharacterArmature|Run_Back', label: 'Run Back (Geri Koşma)' },
  { name: 'CharacterArmature|Run_Left', label: 'Run Left (Sol Koşma)' },
  { name: 'CharacterArmature|Run_Right', label: 'Run Right (Sağ Koşma)' },
  { name: 'CharacterArmature|Run_Shoot', label: 'Run Shoot (Koşarak Ateş)' },
  { name: 'CharacterArmature|Wave', label: 'Wave (El Sallama)' },
  { name: 'CharacterArmature|Sword_Slash', label: 'Sword Slash (Kılıç Sallama)' },
  { name: 'CharacterArmature|Punch_Left', label: 'Punch Left (Sol Yumruk)' },
  { name: 'CharacterArmature|Punch_Right', label: 'Punch Right (Sağ Yumruk)' },
  { name: 'CharacterArmature|Kick_Left', label: 'Kick Left (Sol Tekme)' },
  { name: 'CharacterArmature|Kick_Right', label: 'Kick Right (Sağ Tekme)' },
  { name: 'CharacterArmature|Roll', label: 'Roll (Yuvarlanma)' },
  { name: 'CharacterArmature|Interact', label: 'Interact (Etkileşim)' },
  { name: 'CharacterArmature|Gun_Shoot', label: 'Gun Shoot (Silah Ateş)' },
  { name: 'CharacterArmature|HitRecieve', label: 'Hit Recieve (Darbe Al)' },
  { name: 'CharacterArmature|HitRecieve_2', label: 'Hit Recieve 2 (Darbe Al 2)' },
  { name: 'CharacterArmature|Death', label: 'Death (Ölüm)' },
]

export default function AnimationController() {
  const [currentAnimation, setCurrentAnimation] = useState('CharacterArmature|Idle_Neutral')
  const [characterScale, setCharacterScale] = useState(2)
  const [rotationY, setRotationY] = useState(0)
  const [activeTab, setActiveTab] = useState('animations')
  
  // Yüklenen animasyonlar
  const [uploadedAnimations, setUploadedAnimations] = useState([])
  const [externalAnimClips, setExternalAnimClips] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  
  const fileInputRef = useRef(null)

  // Animasyon dosyası yükle
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    setIsLoading(true)
    setLoadError(null)
    
    const fileName = file.name.toLowerCase()
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result
        let animations = []
        
        if (fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
          // GLB/GLTF yükle
          const loader = new GLTFLoader()
          const gltf = await new Promise((resolve, reject) => {
            loader.parse(arrayBuffer, '', resolve, reject)
          })
          animations = gltf.animations || []
        } else if (fileName.endsWith('.fbx')) {
          // FBX yükle
          const loader = new FBXLoader()
          const blob = new Blob([arrayBuffer])
          const url = URL.createObjectURL(blob)
          const fbx = await new Promise((resolve, reject) => {
            loader.load(url, resolve, undefined, reject)
          })
          URL.revokeObjectURL(url)
          animations = fbx.animations || []
        } else {
          throw new Error('Desteklenmeyen dosya formatı. GLB, GLTF veya FBX kullanın.')
        }
        
        if (animations.length === 0) {
          throw new Error('Bu dosyada animasyon bulunamadı!')
        }
        
        // Animasyon isimlerini düzenle
        const baseName = file.name.replace(/\.(glb|gltf|fbx)$/i, '')
        const newAnimations = animations.map((anim, index) => {
          const animName = anim.name && anim.name !== 'mixamo.com' && anim.name !== 'Take 001' 
            ? anim.name 
            : `${baseName}_${index}`
          anim.name = animName
          return anim
        })
        
        // Yeni animasyonları ekle
        setExternalAnimClips(prev => [...prev, ...newAnimations])
        setUploadedAnimations(prev => [
          ...prev, 
          ...newAnimations.map(anim => ({
            name: anim.name,
            label: `📁 ${anim.name}`,
            isUploaded: true
          }))
        ])
        
        // İlk yüklenen animasyonu seç
        if (newAnimations.length > 0) {
          setCurrentAnimation(newAnimations[0].name)
        }
        
        console.log(`✅ ${newAnimations.length} animasyon yüklendi:`, newAnimations.map(a => a.name))
        
      } catch (error) {
        console.error('Animasyon yüklenirken hata:', error)
        setLoadError(error.message)
      } finally {
        setIsLoading(false)
        event.target.value = ''
      }
    }
    
    reader.readAsArrayBuffer(file)
  }, [])

  // Yüklenen animasyonu sil
  const removeUploadedAnimation = (animName) => {
    setUploadedAnimations(prev => prev.filter(a => a.name !== animName))
    setExternalAnimClips(prev => prev.filter(a => a.name !== animName))
    if (currentAnimation === animName) {
      setCurrentAnimation('CharacterArmature|Idle_Neutral')
    }
  }

  const copyToClipboard = () => {
    const code = `<Character animationName="${currentAnimation}" />`
    navigator.clipboard.writeText(code)
    alert('Kod kopyalandı!')
  }

  const buttonStyle = {
    padding: '10px 12px',
    backgroundColor: '#16213e',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '13px',
    transition: 'all 0.2s',
    width: '100%'
  }

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#00d4ff',
    color: '#000'
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Sol Panel */}
      <div style={{
        width: '350px',
        backgroundColor: '#1a1a2e',
        color: 'white',
        padding: '20px',
        overflowY: 'auto',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#00d4ff' }}>🎮 Animasyon Kontrol</h2>
        
        {/* Tab Butonları */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('animations')}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: activeTab === 'animations' ? '#00d4ff' : '#16213e',
              color: activeTab === 'animations' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            🎬 Animasyonlar
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: activeTab === 'upload' ? '#00d4ff' : '#16213e',
              color: activeTab === 'upload' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            📤 Animasyon Ekle
          </button>
        </div>

        {activeTab === 'animations' ? (
          <>
            {/* Mevcut Animasyon */}
            <div style={{
              backgroundColor: '#16213e',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>Şu anki animasyon:</p>
              <p style={{ fontSize: '14px', color: '#00d4ff', wordBreak: 'break-all' }}>{currentAnimation}</p>
              <button
                onClick={copyToClipboard}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#00d4ff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📋 Kodu Kopyala
              </button>
            </div>

            {/* Karakter Ayarları */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#888' }}>Karakter Ayarları</h3>
              
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Boyut: {characterScale.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={characterScale}
                onChange={(e) => setCharacterScale(parseFloat(e.target.value))}
                style={{ width: '100%', marginBottom: '15px' }}
              />

              <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>
                Dönüş (Y): {rotationY}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={rotationY}
                onChange={(e) => setRotationY(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Yüklenen Animasyonlar */}
            {uploadedAnimations.length > 0 && (
              <>
                <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#4caf50' }}>📁 Yüklenen Animasyonlar</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                  {uploadedAnimations.map((anim) => (
                    <div key={anim.name} style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => setCurrentAnimation(anim.name)}
                        style={{
                          ...(currentAnimation === anim.name ? activeButtonStyle : buttonStyle),
                          flex: 1
                        }}
                      >
                        {anim.label}
                      </button>
                      <button
                        onClick={() => removeUploadedAnimation(anim.name)}
                        style={{
                          padding: '10px',
                          backgroundColor: '#e94560',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title="Sil"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Varsayılan Animasyon Listesi */}
            <h3 style={{ fontSize: '14px', marginBottom: '10px', color: '#888' }}>Mevcut Animasyonlar</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {DEFAULT_ANIMATIONS.map((anim) => (
                <button
                  key={anim.name}
                  onClick={() => setCurrentAnimation(anim.name)}
                  style={currentAnimation === anim.name ? activeButtonStyle : buttonStyle}
                >
                  {anim.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Animasyon Yükleme */}
            <div style={{
              backgroundColor: '#16213e',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#00d4ff' }}>📤 Animasyon Dosyası Yükle</h3>
              
              <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '15px', lineHeight: '1.5' }}>
                Mixamo veya başka kaynaklardan aldığın animasyon dosyalarını yükleyebilirsin.
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf,.fbx"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: isLoading ? '#333' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  marginBottom: '10px'
                }}
              >
                {isLoading ? '⏳ Yükleniyor...' : '📁 Dosya Seç (GLB, GLTF, FBX)'}
              </button>
              
              {loadError && (
                <div style={{
                  padding: '10px',
                  backgroundColor: '#ff000033',
                  border: '1px solid #e94560',
                  borderRadius: '6px',
                  color: '#ff6b6b',
                  fontSize: '12px',
                  marginTop: '10px'
                }}>
                  ❌ {loadError}
                </div>
              )}
            </div>

            {/* Nasıl Kullanılır */}
            <div style={{
              backgroundColor: '#16213e',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '14px', marginBottom: '15px', color: '#888' }}>📖 Nasıl Kullanılır?</h3>
              
              <div style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.8' }}>
                <p style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#00d4ff' }}>1. Mixamo'dan Animasyon İndir:</strong><br/>
                  • <a href="https://www.mixamo.com" target="_blank" rel="noreferrer" style={{ color: '#00d4ff' }}>mixamo.com</a>'a git<br/>
                  • Bir karakter seç (veya "Y Bot" kullan)<br/>
                  • Animasyon seç (Golf Swing, Dance, vb.)<br/>
                  • Download → Format: <strong>FBX</strong><br/>
                  • Skin: <strong>Without Skin</strong> (sadece animasyon)
                </p>
                
                <p style={{ marginBottom: '15px' }}>
                  <strong style={{ color: '#00d4ff' }}>2. Dosyayı Buraya Yükle:</strong><br/>
                  • "Dosya Seç" butonuna tıkla<br/>
                  • İndirdiğin .fbx dosyasını seç
                </p>
                
                <p style={{ marginBottom: '0' }}>
                  <strong style={{ color: '#00d4ff' }}>3. Animasyonu Test Et:</strong><br/>
                  • "Animasyonlar" sekmesine geç<br/>
                  • Yüklenen animasyonu listeden seç
                </p>
              </div>
            </div>

            {/* Uyarı */}
            <div style={{
              backgroundColor: '#ff980033',
              border: '1px solid #ff9800',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#ffb74d',
              lineHeight: '1.6'
            }}>
              <strong>⚠️ Önemli Not:</strong><br/>
              Animasyonun düzgün çalışması için, animasyondaki kemik (bone) isimleri karakterinkiyle uyumlu olmalı. Mixamo'dan "Without Skin" seçeneğiyle indirilen animasyonlar genellikle çalışır.
            </div>
          </>
        )}

        {/* Ana Sayfaya Dön */}
        <a
          href="/"
          style={{
            display: 'block',
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#e94560',
            color: 'white',
            textAlign: 'center',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          ← Ana Sayfaya Dön
        </a>
      </div>

      {/* Sağ Panel - 3D Sahne */}
      <div style={{ flex: 1 }}>
        <Canvas
          shadows
          camera={{ position: [0, 2, 5], fov: 50 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#1a1a2e']} />
          
          <Suspense fallback={null}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={0.5} />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
              <circleGeometry args={[5, 64]} />
              <meshStandardMaterial color="#2d2d44" />
            </mesh>

            <gridHelper args={[10, 20, '#444466', '#333355']} />

            <Character
              position={[0, 0, 0]}
              scale={characterScale}
              rotation={[0, (rotationY * Math.PI) / 180, 0]}
              animationName={currentAnimation}
              externalAnimations={externalAnimClips}
            />

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              target={[0, 1, 0]}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  )
}
