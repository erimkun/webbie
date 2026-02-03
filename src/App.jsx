import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Sky, SoftShadows } from '@react-three/drei'
import { Suspense, createContext, useState, useEffect, useRef, useContext } from 'react'
import * as THREE from 'three'
import World from './components/World'
import Terrain from './components/Terrain'
import Trees from './components/Trees'
import Water from './components/Water'
import Balloons from './components/Balloons'
import Clouds from './components/Clouds'
import Character from './components/Character'
import Fauna from './components/Fauna'
import ShatterTransition from './components/ShatterTransition'

// Global scroll context - tüm bileşenler erişebilsin
export const ScrollContext = createContext({ progress: 0 })

// Scroll Provider component
function ScrollProvider({ children }) {
  const [progress, setProgress] = useState(0)
  const progressRef = useRef(0)

  useEffect(() => {
    // Manuel Scroll Handler
    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY * 0.00015 // Çok çok yavaş scroll
      
      // Auto-scroll sırasında (0.75 sonrası) manuel müdahaleyi kısıtla
      // Sadece yukarı scroll (geri gitme) serbest olsun
      if (progressRef.current >= 0.75 && e.deltaY > 0) {
        return
      }

      progressRef.current = Math.min(Math.max(progressRef.current + delta, 0), 1)
      setProgress(progressRef.current)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })

    // Auto Scroll Loop
    let animationFrameId
    const autoScroll = () => {
      // Topun deliğe girmesi (0.75) ile bitiş (1.0) arasında otomatik aksın
      if (progressRef.current >= 0.75 && progressRef.current < 1.0) {
        // Hız ayarı: 0.0004 (Yaklaşık 5-6 saniyede tamamlar)
        // Havai fişeklerin ve parçalanmanın tadını çıkarmak için yavaş
        progressRef.current = Math.min(progressRef.current + 0.0004, 1.0)
        setProgress(progressRef.current)
      }
      animationFrameId = requestAnimationFrame(autoScroll)
    }
    autoScroll()

    return () => {
      window.removeEventListener('wheel', handleWheel)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <ScrollContext.Provider value={{ progress, setProgress }}>
      {children}
    </ScrollContext.Provider>
  )
}

// Kamera Kontrolcüsü - Topu takip eden kamera (smooth geçişli)
function CameraController() {
  const { camera } = useThree()
  const { progress } = useContext(ScrollContext)
  
  // Smooth geçiş için ref'ler
  const currentCamPos = useRef(new THREE.Vector3(0, 10, 55))
  const currentLookAt = useRef(new THREE.Vector3(0, 4, 40))
  const targetCamPos = useRef(new THREE.Vector3(0, 10, 55))
  const targetLookAt = useRef(new THREE.Vector3(0, 4, 40))
  
  // Başlangıç kamera pozisyonu
  const startCamPos = useRef(new THREE.Vector3(0, 10, 55))
  const startLookAtPos = useRef(new THREE.Vector3(0, 4, 40))
  
  // Kamera takip başlangıç eşiği (top hareket etmeye başladığında)
  const cameraStartThreshold = 0.4
  const ballEndThreshold = 0.75
  
  // Top pozisyonunu hesapla (Terrain.jsx'taki ile aynı mantık)
  const getBallPosition = (scrollProgress) => {
    const ballStartThreshold = 0.4
    
    // Top başlangıç pozisyonu (global)
    // GolfBallWithTee position: [-0.2, 5.6, 40], Terrain position: [0, -2, 0]
    // Ball local: [0, 0.45, 0] -> Global: [-0.2, 5.6 - 2 + 0.45, 40] = [-0.2, 4.05, 40]
    const startPos = new THREE.Vector3(-0.2, 4.05, 40)
    const holePos = new THREE.Vector3(7.0, 1.2, -12)
    
    if (scrollProgress <= ballStartThreshold) {
      return startPos
    }
    
    if (scrollProgress >= ballEndThreshold) {
      return holePos
    }
    
    const ballProgress = (scrollProgress - ballStartThreshold) / (ballEndThreshold - ballStartThreshold)
    
    // Ara noktalar (global koordinatlar) - Terrain offset dahil
    const flightMid1 = new THREE.Vector3(1.8, 4.3, 30)
    const flightMid2 = new THREE.Vector3(3.8, 4.1, 15)
    const flightMid3 = new THREE.Vector3(5.3, 2.5, 2)
    const landingPos = new THREE.Vector3(6.8, 1.4, -8)
    
    const phase1End = 0.55
    const flightHeight = 18
    
    let x, y, z
    
    if (ballProgress <= phase1End) {
      const t = ballProgress / phase1End
      
      if (t < 0.25) {
        const localT = t / 0.25
        x = THREE.MathUtils.lerp(startPos.x, flightMid1.x, localT)
        z = THREE.MathUtils.lerp(startPos.z, flightMid1.z, localT)
      } else if (t < 0.5) {
        const localT = (t - 0.25) / 0.25
        x = THREE.MathUtils.lerp(flightMid1.x, flightMid2.x, localT)
        z = THREE.MathUtils.lerp(flightMid1.z, flightMid2.z, localT)
      } else if (t < 0.75) {
        const localT = (t - 0.5) / 0.25
        x = THREE.MathUtils.lerp(flightMid2.x, flightMid3.x, localT)
        z = THREE.MathUtils.lerp(flightMid2.z, flightMid3.z, localT)
      } else {
        const localT = (t - 0.75) / 0.25
        x = THREE.MathUtils.lerp(flightMid3.x, landingPos.x, localT)
        z = THREE.MathUtils.lerp(flightMid3.z, landingPos.z, localT)
      }
      
      const baseY = THREE.MathUtils.lerp(startPos.y, landingPos.y, t)
      const parabolicHeight = Math.sin(Math.PI * t) * flightHeight * 0.7
      y = baseY + parabolicHeight
      
    } else {
      // Sekme ve yuvarlanma fazlarında - basitleştirilmiş
      const t = (ballProgress - phase1End) / (1 - phase1End)
      x = THREE.MathUtils.lerp(landingPos.x, holePos.x, t)
      z = THREE.MathUtils.lerp(landingPos.z, holePos.z, t)
      y = THREE.MathUtils.lerp(landingPos.y, holePos.y, t)
    }
    
    return new THREE.Vector3(x, y, z)
  }
  
  // Havai fişek pozisyonunu hesapla
  const getFireworkPosition = (scrollProgress) => {
    const fireworkStartThreshold = 0.75
    const explosionHeight = 30
    const holeGlobalPos = new THREE.Vector3(7, 1, -11) // Delik global pozisyonu
    
    if (scrollProgress < fireworkStartThreshold) {
      return holeGlobalPos
    }
    
    const fireworkProgress = (scrollProgress - fireworkStartThreshold) / (1 - fireworkStartThreshold)
    const rocketPhaseEnd = 0.6
    
    if (fireworkProgress <= rocketPhaseEnd) {
      // Roket uçuş fazı
      const rocketT = fireworkProgress / rocketPhaseEnd
      const easedT = 1 - Math.pow(1 - rocketT, 2)
      const y = holeGlobalPos.y + easedT * explosionHeight
      return new THREE.Vector3(holeGlobalPos.x, y, holeGlobalPos.z)
    } else {
      // Patlama fazı - sabit yükseklikte
      return new THREE.Vector3(holeGlobalPos.x, holeGlobalPos.y + explosionHeight, holeGlobalPos.z)
    }
  }
  
  useFrame((state, delta) => {
    // Smooth interpolation factor - delta bazlı smooth hareket
    const smoothFactor = 1 - Math.pow(0.001, delta) // Çok yumuşak geçiş
    
    // Havai fişek eşiği
    const fireworkStartThreshold = 0.75
    
    if (progress <= cameraStartThreshold) {
      // Kamera başlangıç pozisyonunda
      targetCamPos.current.copy(startCamPos.current)
      targetLookAt.current.copy(startLookAtPos.current)
    } else if (progress >= fireworkStartThreshold) {
      // HAVAİ FİŞEK TAKİBİ
      const fireworkPos = getFireworkPosition(progress)
      const fireworkProgress = (progress - fireworkStartThreshold) / (1 - fireworkStartThreshold)
      
      // Kamera havai fişeğin yanından yukarı doğru takip etsin
      const cameraOffset = new THREE.Vector3(
        -8,  // Soldan bak
        -5 + fireworkProgress * 10,   // Roketle birlikte yüksel
        12   // Arkadan bak
      )
      
      targetCamPos.current.copy(fireworkPos).add(cameraOffset)
      
      // Kamera rokete/patlamaya baksın
      const lookOffset = new THREE.Vector3(0, 2, 0) // Biraz yukarıya bak
      targetLookAt.current.copy(fireworkPos).add(lookOffset)
      
    } else {
      // TOP TAKİBİ (%30 - %75 arası)
      const cameraProgress = (progress - cameraStartThreshold) / (ballEndThreshold - cameraStartThreshold)
      
      // Topun pozisyonunu al
      const ballPos = getBallPosition(progress)
      
      // Kamera topun arkasından ve biraz yukarıdan takip etsin
      const cameraOffset = new THREE.Vector3(
        -2 + cameraProgress * 1,  // Biraz sola, sonra sağa doğru
        3 + cameraProgress * 2,   // Yukarıda, ilerledikçe biraz daha yüksel
        8 - cameraProgress * 3    // Arkada, ilerledikçe yakınlaş
      )
      
      // Hedef kamera pozisyonu
      targetCamPos.current.copy(ballPos).add(cameraOffset)
      
      // Kamera topa baksın - sonda daha sağa bak
      const lookAhead = new THREE.Vector3(
        2 + cameraProgress * 1,  // Sağa doğru bak (özellikle sonda)
        -1,                       // Biraz aşağı
        -3 - cameraProgress * 2   // Topun biraz önüne bak
      )
      targetLookAt.current.copy(ballPos).add(lookAhead)
    }
    
    // Smooth kamera pozisyon geçişi
    currentCamPos.current.lerp(targetCamPos.current, smoothFactor)
    camera.position.copy(currentCamPos.current)
    
    // Smooth lookAt geçişi
    currentLookAt.current.lerp(targetLookAt.current, smoothFactor)
    camera.lookAt(currentLookAt.current)
  })
  
  return null
}

// Kırılma sonrası görünecek arka plan sayfası
function BackgroundPage() {
  const { progress } = useContext(ScrollContext)
  
  // Kırılma başladığında görünür olsun - patlama ile aynı anda (%89)
  const shatterStart = 0.89
  const isVisible = progress > shatterStart
  
  // Scroll geri gidince gizlen
  if (!isVisible) {
    return null
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'radial-gradient(circle at center, #1b2735 0%, #090a0f 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 5, // Canvas'ın altında ama SkyBackground'un üstünde
      opacity: Math.min((progress - shatterStart) / 0.08, 1),
      transition: 'opacity 0.2s ease',
      fontFamily: '"Montserrat", "Inter", sans-serif'
    }}>
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
        opacity: 0.05,
        pointerEvents: 'none'
      }}></div>

      <h2 style={{
        fontSize: 'clamp(1rem, 2vw, 1.5rem)',
        color: '#64ffda',
        marginBottom: '1rem',
        letterSpacing: '0.4em',
        textTransform: 'uppercase',
        fontWeight: '300'
      }}>
        Developed By
      </h2>

      <h1 style={{
        fontSize: 'clamp(3rem, 8vw, 6rem)',
        fontWeight: '800',
        background: 'linear-gradient(to right, #e0e0e0, #ffffff, #64ffda)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textAlign: 'center',
        margin: 0,
        textShadow: '0 0 30px rgba(100, 255, 218, 0.3)',
        letterSpacing: '-0.02em',
        lineHeight: 1.1
      }}>
        ERDEN ERİM<br/>AYDOĞDU
      </h1>
      
      <div style={{
        width: '100px',
        height: '4px',
        background: '#64ffda',
        margin: '2rem 0',
        borderRadius: '2px',
        boxShadow: '0 0 10px rgba(100, 255, 218, 0.5)'
      }}></div>
      
      <p style={{
        fontSize: 'clamp(1rem, 2vw, 1.2rem)',
        color: '#8892b0',
        marginTop: '1rem',
        fontWeight: '300',
        letterSpacing: '0.1em',
        maxWidth: '600px',
        textAlign: 'center',
        lineHeight: 1.6
      }}>
        Creative Developer & 3D Web Enthusiast
      </p>
    </div>
  )
}

// Gökyüzü arka planı - Canvas şeffaf olduğu için
function SkyBackground() {
  const { progress } = useContext(ScrollContext)
  const shatterStart = 0.89
  
  // Kırılma başladığında kaybol
  // Kırılma başladığında hızlıca kaybol
  const isHidden = progress > shatterStart
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(to bottom, #5CA0D3 0%, #F0F8FF 100%)',
      zIndex: 2, // BackgroundPage'in altında
      opacity: isHidden ? 0 : 1,
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none'
    }} />
  )
}

// Sahne sarmalayıcı - kırılma anında 3D dünyayı gizler
function SceneWrapper({ children }) {
  const { progress } = useContext(ScrollContext)
  const { scene } = useThree()
  
  // Kırılma texture'ı 0.88 civarında alınıyor
  // 0.89'da patlama başlıyor, sahne tam o an gizlensin
  const isVisible = progress < 0.889

  useEffect(() => {
    // Görünür değilse background ve fog'u temizle (transparent olsun)
    if (!isVisible) {
      scene.background = null
      scene.fog = null
    } else {
      // Görünürse ve background yoksa geri getir
      // Performans için sadece null ise set et
      if (!scene.background) scene.background = new THREE.Color('#7ec8e3')
      if (!scene.fog) scene.fog = new THREE.Fog('#7ec8e3', 200, 500)
    }
  }, [isVisible, scene])
  
  return <group visible={isVisible}>{children}</group>
}

export default function App() {
  return (
    <ScrollProvider>
      {/* Gökyüzü arka planı */}
      <SkyBackground />
      
      {/* Arkadaki sayfa - kırılma sonrası görünecek */}
      <BackgroundPage />
      
      <Canvas
        shadows
        camera={{ position: [0, 10, 55], fov: 50, near: 0.1, far: 1000 }}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 10,
          pointerEvents: 'none'
        }}
      >
        <Suspense fallback={null}>
          {/* Yumuşak Gölgeler - Profesyonel görünüm için */}
          <SoftShadows size={20} samples={12} focus={0.5} />
          
          <SceneWrapper>
            {/* Gökyüzü - PARLAK GÜNEŞLİ ve NEŞELİ - Daha mavi ve sıcak */}
            <Sky
              distance={450000}
              sunPosition={[100, 40, 50]}
              inclination={0.5}
              azimuth={0.25}
              turbidity={8}
              rayleigh={6}
              mieCoefficient={0.005}
              mieDirectionalG={0.8}
            />
            
            {/* Ortam aydınlatması - SICAK ve PARLAK */}
            <ambientLight intensity={1.2} color="#fffcf5" />
            <hemisphereLight intensity={0.8} color="#87CEEB" groundColor="#7cb87c" />
            
            {/* Ana güneş ışığı - GÜÇLÜ */}
            <directionalLight
              position={[80, 150, 60]}
              intensity={2.2}
              color="#fff8d5"
              castShadow
              shadow-mapSize={[4096, 4096]}
              shadow-camera-far={250}
              shadow-camera-left={-80}
              shadow-camera-right={80}
              shadow-camera-top={80}
              shadow-camera-bottom={-80}
              shadow-bias={-0.0001}
            />
            
            {/* Dolgu ışığı - gölgeleri yumuşatır */}
            <directionalLight
              position={[-50, 80, -50]}
              intensity={0.6}
              color="#ffeacc"
            />
            
            {/* Dünya bileşenleri */}
            <World />
            <Terrain />
            <Trees />
            <Water />
            <Balloons />
            <Clouds />
            <Fauna />
            
            {/* Karakter - Golf topunun yanında, scroll ile animasyon */}
            <Character 
              position={[-1.0, 3.9, 40.1]} 
              scale={0.01} 
              rotation={[0, -110, 0]} 
              animationFile="/GolfVurusu.fbx"
              scrollControlled={true}
              golfClubFile="/GolfClub.glb"
            />
            
            {/* Dans eden karakter - Bayrağın yanında */}
            <Character 
              position={[6.5, 1.0, -12]} 
              scale={0.01} 
              rotation={[0, 0, 0]} 
              animationFile="/dance.fbx"
              scrollControlled={false}
            />
          </SceneWrapper>
          
          {/* Kamera kontrolcüsü - topu takip eder */}
          <CameraController />
          
          {/* Ekran kırılma efekti */}
          <ShatterTransition />
          
          {/* Kamera kontrolleri kapatıldı - scroll bazlı kamera için */}
        </Suspense>
      </Canvas>
    </ScrollProvider>
  )
}
