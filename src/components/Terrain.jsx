import { useMemo, useRef, useContext } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ScrollContext } from '../App'

export default function Terrain() {
  const { progress } = useContext(ScrollContext)
  
  return (
    <group position={[0, -2, 0]}>
      {/* 1. ZEMİN - Alt taban rengi (Koyu yeşil Rough) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <circleGeometry args={[60, 64]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.9} />
      </mesh>

      {/* 2. ÖN PLAN (CAMERA DURDUĞU YER) - Yüksek Tekpe */}
      {/* Kameranın hemen altında ve önünde geniş bir yükselti */}
      <Hill position={[0, -2, 45]} scaleVec={[60, 8, 30]} color="#3d7a32" /> 
      
      {/* 3. SAHİL & KUMSAL ALANI (YENİLENMİŞ) */}
      {/* Su Konumu: x=-38, z=15, radius=18. Kıyı şeridi yaklaşık x=-20 civarındadır. */}
      {/* Bu yüzden kumsalı x=-20 civarına yerleştiriyoruz ki suyla karayı birleştirsin */}
      <group position={[-20, 0.4, 15]}>
        {/* Ana Sahil Dairesi - Karadan suya doğru uzanan */}
        
        
        {/* İkinci Sahil Parçası - Biraz daha sağda ve yukarıda */}
        <mesh rotation={[-Math.PI / 2, -0.15, 0.5]} position={[-10, 0.5, 3.3]} receiveShadow>
          <circleGeometry args={[12, 64]} />
          <meshStandardMaterial color="#e0cda5" roughness={1} flatShading />
        </mesh>
        <mesh rotation={[-Math.PI / 2, -0.15, 0.5]} position={[-10, 0.5, 16]} receiveShadow>
          <circleGeometry args={[18, 64]} />
          <meshStandardMaterial color="#e0cda5" roughness={1} flatShading />
        </mesh>
        <mesh rotation={[-Math.PI / 2.2, 0, 0]} position={[-18, 0.5, 3]} receiveShadow>
          <circleGeometry args={[18, 64]} />
          <meshStandardMaterial color="#e0cda5" roughness={1} flatShading />
        </mesh>

      </group>

      {/* 3.1 SOL TARAF (WATER SIDE) - Sahile doğru iniş */}
      {/* Sol tarafı biraz daha alçak tutuyoruz ama tepelerle destekliyoruz */}
      <Hill position={[-20, -3, 10]} scaleVec={[30, 5, 30]} color="#4a8c3f" />

      {/* 4. SAĞ TARAF - Ormanlık alan yükseltisi */}
      <Hill position={[30, -1, 15]} scaleVec={[35, 7, 35]} color="#2d5a27" />
      <Hill position={[40, 0, -10]} scaleVec={[30, 8, 30]} color="#3d7a32" />

      {/* 5. FAIRWAY (GOLF SAHASI) - Orta alan dalgalanmaları */}
      {/* Ana oyun alanı - Burası açık renkli fairway */}
      {/* Dalgalı zemin etkisi için üst üste binmiş basık küreler */}
      
      {/* Merkez Vadi Başlangıcı */}
      <Hill position={[-5, -1, 20]} scaleVec={[25, 3, 20]} color="#4caf50" />
      
      {/* İleriye doğru giden yol (Fairway) */}
      <Hill position={[0, -1.5, 0]} scaleVec={[20, 2, 30]} color="#5cb85c" />
      <Hill position={[10, -1, -20]} scaleVec={[25, 4, 25]} color="#5cb85c" />
      
      {/* Sol arka taraf (Green alanı gibi) */}
      <Hill position={[-15, -0.5, -30]} scaleVec={[20, 3, 20]} color="#66bb6a" />

      {/* 6. KUM HAVUZLARI (Bunkers) - Smooth geçişli */}
      <SandBunker position={[15, 0.2, -5]} rotation={0.5} size={3} />
      <SandBunker position={[-12, 0.1, 15]} rotation={-0.2} size={2} scaleY={2} />

      {/* 7. GREEN ALANI (GOLF HEDEFİ) */}
      {/* Z-fighting olmaması için hafif yukarıda: y=0.15 */}
      <group position={[7, 3, -12]}>
        {/* Green Zemini - Çok açık yeşil, pürüzsüz */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[5, 64]} />
          <meshStandardMaterial color="#90c060" roughness={0.2} />
        </mesh>
        
        {/* Hole (Delik) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1]}>
          <circleGeometry args={[0.15, 32]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        
        {/* Bayrak Direği */}
        <mesh position={[0, 1.5, 1]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 3, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.3} />
        </mesh>
        
        {/* Dalgalanan Bayrak */}
        <WavingFlag position={[0, 5.3, 1]} />
      </group>

      {/* 8. GOLF TOPU VE TEE (Kamera önü) */}
      {/* Kamera pozisyonu: [0, 10, 55], top kameranın hemen önünde olacak */}
      <GolfBallWithTee position={[-0.2, 5.6, 40]} scrollProgress={progress} />

      {/* 9. HAVAİ FİŞEK - Top deliğe girdikten sonra */}
      <Firework position={[7, 3, -11]} scrollProgress={progress} />

    </group>
  )
}

// Golf Fairway - Şeritli çim görünümü
function GolfFairway() {
  const stripes = useMemo(() => {
    const result = []
    // Geniş fairway şeritleri
    for (let i = 0; i < 18; i++) {
      const zPos = 45 - i * 5
      const isLight = i % 2 === 0
      // Genişlik ortalarda daha fazla
      const baseWidth = 22
      const widthVariation = Math.sin((i / 18) * Math.PI) * 10
      result.push({
        position: [3, 0.2 + i * 0.003, zPos],
        width: baseWidth + widthVariation,
        length: 5.2,
        color: isLight ? '#5cb85c' : '#449944'
      })
    }
    return result
  }, [])
  
  return (
    <group>
      {stripes.map((stripe, i) => (
        <mesh 
          key={i} 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={stripe.position}
          receiveShadow
        >
          <planeGeometry args={[stripe.width, stripe.length]} />
          <meshStandardMaterial 
            color={stripe.color} 
            roughness={0.65}
          />
        </mesh>
      ))}
    </group>
  )
}

// Tepe Bileşeni: Basık küre kullanarak yumuşak tepe oluşturur
function Hill({ position, scaleVec, color = "#3d7a32" }) {
  return (
    <mesh position={position} scale={scaleVec} receiveShadow castShadow>
      {/* Low-poly görünüm için segment sayısını düşürdük */}
      <sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      {/* Flat shading ile daha stilize ve az "düz renk" görünümü */}
      <meshStandardMaterial color={color} roughness={0.8} flatShading />
    </mesh>
  )
}

// Smooth geçişli kum havuzu
function SandBunker({ position, rotation = 0, size = 3, scaleY = 1 }) {
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, rotation]} scale={[1, scaleY, 1]}>
      {/* Ana kum alanı */}
      <mesh receiveShadow>
        <circleGeometry args={[size, 64]} />
        <meshStandardMaterial color="#e8d9a0" roughness={1} />
      </mesh>
      {/* Kenar geçiş halkası - koyu yeşile doğru */}
      <mesh position={[0, 0, -0.01]}>
        <ringGeometry args={[size * 0.85, size * 1.15, 64]} />
        <meshStandardMaterial 
          color="#a0c870" 
          roughness={0.9} 
          transparent 
          opacity={0.7}
        />
      </mesh>
    </group>
  )
}

// Dalgalanan Bayrak Bileşeni
function WavingFlag({ position }) {
  const flagRef = useRef()
  const geometryRef = useRef()
  
  // Bayrak geometry'sini bir kere oluştur
  const flagGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(0.7, 0.5, 20, 10)
    return geo
  }, [])
  
  useFrame((state) => {
    if (geometryRef.current) {
      const positions = geometryRef.current.attributes.position
      const time = state.clock.elapsedTime
      
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        
        // x pozisyonuna göre dalga efekti (bayrak direğinden uzaklaştıkça artır)
        const waveX = (x + 0.35) / 0.7 // 0-1 aralığında normalize et
        const wave = Math.sin(time * 4 + waveX * 3) * 0.05 * waveX
        const wave2 = Math.sin(time * 6 + waveX * 5) * 0.02 * waveX
        
        positions.setZ(i, wave + wave2)
      }
      positions.needsUpdate = true
    }
  })
  
  return (
    <mesh ref={flagRef} position={[0.35, position[1] - 2.65, position[2]]} castShadow>
      <primitive object={flagGeometry} ref={geometryRef} attach="geometry" />
      <meshStandardMaterial color="#ff1744" side={THREE.DoubleSide} />
    </mesh>
  )
}

// Golf Topu ve Tee Bileşeni - Scroll ile hareket eden (sekme ve yuvarlanma ile)
function GolfBallWithTee({ position, scrollProgress = 0 }) {
  const ballRef = useRef()
  
  // Top başlangıç pozisyonu (tee üzerinde)
  const startPos = useMemo(() => new THREE.Vector3(0, 0.45, 0), [])
  
  // Uçuş ara noktaları - daha smooth hareket için
  const flightMid1 = useMemo(() => new THREE.Vector3(2.0, 0.3, -10), [])  // İlk çeyrek
  const flightMid2 = useMemo(() => new THREE.Vector3(4.0, 0.1, -25), [])  // Orta nokta
  const flightMid3 = useMemo(() => new THREE.Vector3(5.5, -1.5, -38), []) // Üçüncü çeyrek
  
  // Green üzerindeki düşüş noktası (deliğin önünde)
  const landingPos = useMemo(() => new THREE.Vector3(7.0, -2.6, -48), [])
  
  // İlk sekme ara noktası
  const bounce1Mid = useMemo(() => new THREE.Vector3(7.08, -2.6, -49), [])
  
  // İlk sekme sonrası pozisyon
  const bounce1Pos = useMemo(() => new THREE.Vector3(7.15, -2.6, -50), [])
  
  // İkinci sekme ara noktası
  const bounce2Mid = useMemo(() => new THREE.Vector3(7.1, -2.6, -49.5), [])
  
  // İkinci sekme sonrası pozisyon  
  const bounce2Pos = useMemo(() => new THREE.Vector3(7.15, -2.6, -50), [])
  
  // Üçüncü küçük sekme - deliğin tam üstü
  // Delik: Green [7, 3, -12] + Hole [0, 0.02, 1] = Global [7, 3.02, -11]
  // Ball group offset: [-0.2, 5.6, 40] -> Relative: [7.2, -2.58, -51]
  const bounce3Pos = useMemo(() => new THREE.Vector3(7.2, -2.58, -51), [])
  
  // Delik pozisyonu (son hedef) - 3. sekme ile aynı X,Z ama biraz daha aşağıda
  const holePos = useMemo(() => new THREE.Vector3(7.2, -2.9, -51), [])
  
  // Animasyon fazları ve yükseklikleri
  const flightHeight = 18 // Ana uçuş yüksekliği
  const bounce1Height = 1.2 // İlk sekme yüksekliği
  const bounce2Height = 0.5 // İkinci sekme yüksekliği
  const bounce3Height = 0.2 // Üçüncü sekme yüksekliği
  
  // Top hareket etmeye 0.38'de başlayacak, 0.75'te bitecek (karakter vuruşu yaptıktan sonra)
  const ballStartThreshold = 0.38
  const ballEndThreshold = 0.75
  
  // Faz geçiş noktaları (0-1 arasında, ball progress için)
  const phase1End = 0.55   // Uçuş fazı sonu (green'e düşüş)
  const phase2End = 0.70   // İlk sekme sonu
  const phase3End = 0.85   // İkinci sekme sonu
  const phase4End = 0.95   // Üçüncü sekme sonu - deliğe düşüş
  // 0.95-1.0: Deliğe giriş (çok kısa)
  
  useFrame(() => {
    if (!ballRef.current) return
    
    // Top sadece 0.30'dan sonra hareket etsin
    if (scrollProgress <= ballStartThreshold) {
      ballRef.current.position.set(startPos.x, startPos.y, startPos.z)
      return
    }
    
    // Top 0.75'ten sonra deliğte kalsın
    if (scrollProgress >= ballEndThreshold) {
      ballRef.current.position.set(holePos.x, holePos.y, holePos.z)
      return
    }
    
    // 0.30-0.75 arasını 0-1 aralığına normalize et
    const ballProgress = (scrollProgress - ballStartThreshold) / (ballEndThreshold - ballStartThreshold)
    
    let x, y, z
    
    if (ballProgress <= phase1End) {
      // FAZ 1: Ana uçuş - tee'den green'e parabolik uçuş (Catmull-Rom benzeri smooth)
      const t = ballProgress / phase1End // 0-1 normalize
      
      // Bezier-like interpolation through multiple points
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
      
      // Parabolik yükseklik - daha yavaş yükseliş için ease-in-out
      const baseY = THREE.MathUtils.lerp(startPos.y, landingPos.y, t)
      // Yavaş yükselip yavaş inen eğri (sine yerine daha yumuşak)
      const parabolicT = t < 0.5 
        ? 2 * t * t  // ease-in (yavaş başla)
        : 1 - Math.pow(-2 * t + 2, 2) / 2  // ease-out (yavaş bitir)
      const parabolicHeight = parabolicT * flightHeight * (t < 0.5 ? 1 : (1 - (t - 0.5) * 2))
      y = baseY + Math.sin(Math.PI * t) * flightHeight * 0.7 + parabolicHeight * 0.3
      
    } else if (ballProgress <= phase2End) {
      // FAZ 2: İlk sekme
      const t = (ballProgress - phase1End) / (phase2End - phase1End)
      if (t < 0.5) {
        const localT = t / 0.5
        x = THREE.MathUtils.lerp(landingPos.x, bounce1Mid.x, localT)
        z = THREE.MathUtils.lerp(landingPos.z, bounce1Mid.z, localT)
      } else {
        const localT = (t - 0.5) / 0.5
        x = THREE.MathUtils.lerp(bounce1Mid.x, bounce1Pos.x, localT)
        z = THREE.MathUtils.lerp(bounce1Mid.z, bounce1Pos.z, localT)
      }
      const baseY = THREE.MathUtils.lerp(landingPos.y, bounce1Pos.y, t)
      const bounceHeight = Math.sin(Math.PI * t) * bounce1Height
      y = baseY + bounceHeight
      
    } else if (ballProgress <= phase3End) {
      // FAZ 3: İkinci sekme
      const t = (ballProgress - phase2End) / (phase3End - phase2End)
      if (t < 0.5) {
        const localT = t / 0.5
        x = THREE.MathUtils.lerp(bounce1Pos.x, bounce2Mid.x, localT)
        z = THREE.MathUtils.lerp(bounce1Pos.z, bounce2Mid.z, localT)
      } else {
        const localT = (t - 0.5) / 0.5
        x = THREE.MathUtils.lerp(bounce2Mid.x, bounce2Pos.x, localT)
        z = THREE.MathUtils.lerp(bounce2Mid.z, bounce2Pos.z, localT)
      }
      const baseY = THREE.MathUtils.lerp(bounce1Pos.y, bounce2Pos.y, t)
      const bounceHeight = Math.sin(Math.PI * t) * bounce2Height
      y = baseY + bounceHeight
      
    } else if (ballProgress <= phase4End) {
      // FAZ 4: Üçüncü küçük sekme - deliğe doğru
      const t = (ballProgress - phase3End) / (phase4End - phase3End)
      x = THREE.MathUtils.lerp(bounce2Pos.x, bounce3Pos.x, t)
      z = THREE.MathUtils.lerp(bounce2Pos.z, bounce3Pos.z, t)
      const baseY = THREE.MathUtils.lerp(bounce2Pos.y, bounce3Pos.y, t)
      const bounceHeight = Math.sin(Math.PI * t) * bounce3Height
      y = baseY + bounceHeight
      
    } else {
      // FAZ 5: Deliğe düşüş - çok kısa, sadece aşağı
      const t = (ballProgress - phase4End) / (1 - phase4End)
      const easedT = 1 - Math.pow(1 - t, 2) // ease-out
      x = bounce3Pos.x // X sabit
      z = bounce3Pos.z // Z sabit
      y = THREE.MathUtils.lerp(bounce3Pos.y, holePos.y, easedT) // Sadece aşağı
    }
    
    ballRef.current.position.set(x, y, z)
  })
  
  return (
    <group position={position}>
      {/* Tee (Golf topu desteği) - sabit kalacak */}
      <mesh position={[0, 0.15, 0]} castShadow>
        {/* Tee gövdesi - ince silindir */}
        <cylinderGeometry args={[0.04, 0.03, 0.3, 16]} />
        <meshStandardMaterial color="#e8d4a8" roughness={0.6} />
      </mesh>
      {/* Tee üst kısmı - küçük koni */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.04, 0.06, 16]} />
        <meshStandardMaterial color="#e8d4a8" roughness={0.6} />
      </mesh>
      
      {/* Golf Topu - hareket edecek */}
      <mesh ref={ballRef} position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.09, 32, 32]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.9} 
          metalness={0.01}
        />
      </mesh>
    </group>
  )
}

// Havai Fişek Bileşeni - Roket ve patlama efekti
function Firework({ position, scrollProgress = 0 }) {
  const rocketRef = useRef()
  const trailRef = useRef()
  const sparkRefs = useRef([])
  const explosionRef = useRef()
  const ringRefs = useRef([])
  const secondarySparkRefs = useRef([])
  const glowRef = useRef()
  
  // Havai fişek başlangıç eşiği - %75'te başlasın (top deliğe girdikten sonra)
  const fireworkStartThreshold = 0.75
  
  // Roket yüksekliği ve patlama noktası
  const maxHeight = 35
  const explosionHeight = 30
  
  // Ana patlama parçacıkları - daha fazla ve çeşitli
  const sparkPositions = useMemo(() => {
    const positions = []
    // İç halka - hızlı yayılan
    for (let i = 0; i < 40; i++) {
      const theta = (i / 40) * Math.PI * 2 + Math.random() * 0.3
      const phi = Math.PI / 2 + (Math.random() - 0.5) * 0.8
      const r = 3 + Math.random() * 2
      const speed = 0.8 + Math.random() * 0.4
      positions.push({
        x: Math.sin(phi) * Math.cos(theta) * r,
        y: Math.cos(phi) * r + Math.random() * 2,
        z: Math.sin(phi) * Math.sin(theta) * r,
        color: ['#ff0000', '#ff3300', '#ff6600', '#ffaa00', '#ffff00'][Math.floor(Math.random() * 5)],
        size: 0.15 + Math.random() * 0.2,
        speed: speed,
        trail: Math.random() > 0.5
      })
    }
    // Dış halka - yavaş yayılan, altın rengi
    for (let i = 0; i < 30; i++) {
      const theta = (i / 30) * Math.PI * 2
      const phi = Math.PI / 2 + (Math.random() - 0.5) * 0.5
      const r = 5 + Math.random() * 3
      positions.push({
        x: Math.sin(phi) * Math.cos(theta) * r,
        y: Math.cos(phi) * r,
        z: Math.sin(phi) * Math.sin(theta) * r,
        color: ['#ffdd00', '#ffcc00', '#ffaa00', '#ffffff', '#ffffaa'][Math.floor(Math.random() * 5)],
        size: 0.1 + Math.random() * 0.15,
        speed: 0.5 + Math.random() * 0.3,
        trail: true
      })
    }
    // Rastgele yıldız parçacıkları
    for (let i = 0; i < 50; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const r = 2 + Math.random() * 6
      positions.push({
        x: Math.sin(phi) * Math.cos(theta) * r,
        y: Math.cos(phi) * r,
        z: Math.sin(phi) * Math.sin(theta) * r,
        color: ['#ff4444', '#ff6600', '#ffcc00', '#ffffff', '#ff0066', '#ff00ff', '#00ffff'][Math.floor(Math.random() * 7)],
        size: 0.08 + Math.random() * 0.12,
        speed: 0.6 + Math.random() * 0.6,
        trail: Math.random() > 0.3
      })
    }
    return positions
  }, [])
  
  // İkincil patlama parçacıkları - gecikmelı mini patlamalar
  const secondarySparks = useMemo(() => {
    const sparks = []
    for (let i = 0; i < 25; i++) {
      const theta = Math.random() * Math.PI * 2
      const r = 3 + Math.random() * 4
      sparks.push({
        x: Math.cos(theta) * r,
        y: Math.random() * 4 - 2,
        z: Math.sin(theta) * r,
        delay: 0.2 + Math.random() * 0.3,
        color: ['#ff3300', '#ffaa00', '#00ff88', '#00aaff', '#ff00aa'][Math.floor(Math.random() * 5)]
      })
    }
    return sparks
  }, [])
  
  useFrame((state) => {
    if (scrollProgress < fireworkStartThreshold) {
      // Henüz başlamadı - roket gizli
      if (rocketRef.current) rocketRef.current.visible = false
      if (trailRef.current) trailRef.current.visible = false
      if (explosionRef.current) explosionRef.current.visible = false
      return
    }
    
    const fireworkProgress = (scrollProgress - fireworkStartThreshold) / (1 - fireworkStartThreshold)
    const rocketPhaseEnd = 0.5 // Roket daha hızlı çıksın
    
    if (fireworkProgress <= rocketPhaseEnd) {
      // ROKET UÇUŞ FAZI
      const rocketT = fireworkProgress / rocketPhaseEnd
      
      if (rocketRef.current) {
        rocketRef.current.visible = true
        // Yukarı doğru hızlanan hareket
        const easedT = 1 - Math.pow(1 - rocketT, 3)
        const y = easedT * explosionHeight
        rocketRef.current.position.y = y
        
        // Daha belirgin sallanma
        const wobble = Math.sin(state.clock.elapsedTime * 25) * 0.05
        rocketRef.current.position.x = wobble
        rocketRef.current.rotation.z = wobble * 0.5
      }
      
      if (trailRef.current) {
        trailRef.current.visible = true
        const easedT = 1 - Math.pow(1 - rocketT, 3)
        trailRef.current.position.y = easedT * explosionHeight - 0.3
        trailRef.current.scale.y = 0.3 + rocketT * 0.8
        // İz parlaklığı
        if (trailRef.current.material) {
          trailRef.current.material.emissiveIntensity = 2 + Math.sin(state.clock.elapsedTime * 30) * 0.5
        }
      }
      
      if (explosionRef.current) explosionRef.current.visible = false
      
    } else {
      // PATLAMA FAZI
      const explosionT = (fireworkProgress - rocketPhaseEnd) / (1 - rocketPhaseEnd)
      
      if (rocketRef.current) rocketRef.current.visible = false
      if (trailRef.current) trailRef.current.visible = false
      
      if (explosionRef.current) {
        explosionRef.current.visible = true
        // Patlama büyürken yükseklik azalsın (yerçekimi etkisi)
        const dropAmount = explosionT * explosionT * 60 // Quadratic düşüş
        explosionRef.current.position.y = explosionHeight - dropAmount
        
        // Ana parçacıkları güncelle
        sparkRefs.current.forEach((spark, i) => {
          if (spark && sparkPositions[i]) {
            const sparkData = sparkPositions[i]
            const t = explosionT * sparkData.speed
            
            // Parçacıklar dışarı yayılır
            const spread = Math.min(t * 3, 3)
            spark.position.x = sparkData.x * spread
            spark.position.y = sparkData.y * spread - t * t * 8 // Güçlü yerçekimi
            spark.position.z = sparkData.z * spread
            
            // Boyut animasyonu - önce büyü, sonra küçül
            const sizeMultiplier = t < 0.2 
              ? t / 0.2 * 1.5 
              : Math.max(0, 1.5 - (t - 0.2) * 1.8)
            spark.scale.setScalar(sizeMultiplier)
            
            // Opaklık ve parlaklık
            if (spark.material) {
              spark.material.opacity = Math.max(0, 1 - t * 1.5)
              spark.material.emissiveIntensity = Math.max(0, 3 - t * 4)
            }
          }
        })
        
        // İkincil parçacıklar (gecikmeli mini patlamalar)
        secondarySparkRefs.current.forEach((spark, i) => {
          if (spark && secondarySparks[i]) {
            const sparkData = secondarySparks[i]
            const delayedT = Math.max(0, explosionT - sparkData.delay)
            
            if (delayedT > 0) {
              spark.visible = true
              const spread = delayedT * 2
              spark.position.x = sparkData.x + Math.sin(delayedT * 10) * 0.5
              spark.position.y = sparkData.y - delayedT * delayedT * 5
              spark.position.z = sparkData.z
              
              const scale = delayedT < 0.1 ? delayedT / 0.1 : Math.max(0, 1 - delayedT * 1.5)
              spark.scale.setScalar(scale * 1.5)
              
              if (spark.material) {
                spark.material.opacity = Math.max(0, 1 - delayedT * 2)
              }
            } else {
              spark.visible = false
            }
          }
        })
        
        // Patlama halkaları
        ringRefs.current.forEach((ring, i) => {
          if (ring) {
            const ringDelay = i * 0.1
            const ringT = Math.max(0, explosionT - ringDelay)
            
            if (ringT > 0) {
              ring.visible = true
              const ringScale = ringT * 8 * (1 + i * 0.5)
              ring.scale.set(ringScale, ringScale, 1)
              
              if (ring.material) {
                ring.material.opacity = Math.max(0, 0.8 - ringT * 2)
              }
            } else {
              ring.visible = false
            }
          }
        })
        
        // Merkez parlaklığı
        if (glowRef.current) {
          const glowScale = explosionT < 0.15 
            ? explosionT / 0.15 * 4 
            : Math.max(0, 4 - (explosionT - 0.15) * 6)
          glowRef.current.scale.setScalar(glowScale)
          
          if (glowRef.current.material) {
            glowRef.current.material.opacity = Math.max(0, 1 - explosionT * 1.5)
          }
        }
      }
    }
  })
  
  return (
    <group position={position}>
      {/* ROKET */}
      <group ref={rocketRef} visible={false}>
        {/* Roket gövdesi */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.1, 0.6, 8]} />
          <meshStandardMaterial color="#cc0000" emissive="#ff3300" emissiveIntensity={0.8} />
        </mesh>
        {/* Roket başı (koni) */}
        <mesh position={[0, 0.4, 0]}>
          <coneGeometry args={[0.1, 0.25, 8]} />
          <meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={1} />
        </mesh>
        {/* Roket kanatları */}
        {[0, 120, 240].map((angle, i) => (
          <mesh 
            key={i} 
            position={[
              Math.sin(angle * Math.PI / 180) * 0.1, 
              -0.25, 
              Math.cos(angle * Math.PI / 180) * 0.1
            ]}
            rotation={[0, angle * Math.PI / 180, 0]}
          >
            <boxGeometry args={[0.02, 0.2, 0.12]} />
            <meshStandardMaterial color="#880000" />
          </mesh>
        ))}
        {/* Güçlü ateş efekti */}
        <pointLight position={[0, -0.5, 0]} color="#ff6600" intensity={8} distance={8} />
        <pointLight position={[0, -0.3, 0]} color="#ffff00" intensity={4} distance={4} />
      </group>
      
      {/* ROKET İZİ - kısa ve parlak */}
      <group ref={trailRef} visible={false}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.12, 0.5, 8]} />
          <meshStandardMaterial 
            color="#ff6600" 
            emissive="#ff3300" 
            emissiveIntensity={2}
            transparent
            opacity={0.9}
          />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.08, 0.15, 0.6, 8]} />
          <meshStandardMaterial 
            color="#ffaa00" 
            emissive="#ff6600" 
            emissiveIntensity={1.5}
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>
      
      {/* PATLAMA */}
      <group ref={explosionRef} visible={false}>
        {/* Çok güçlü merkez ışığı */}
        <pointLight color="#ffffff" intensity={50} distance={40} decay={2} />
        <pointLight color="#ffaa00" intensity={30} distance={30} decay={2} />
        <pointLight color="#ff3300" intensity={20} distance={25} decay={2} />
        
        {/* Merkez glow sphere */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial 
            color="#ffffff"
            emissive="#ffffaa"
            emissiveIntensity={5}
            transparent
            opacity={1}
          />
        </mesh>
        
        {/* Patlama halkaları */}
        {[0, 1, 2].map((i) => (
          <mesh 
            key={`ring-${i}`}
            ref={el => ringRefs.current[i] = el}
            rotation={[Math.PI / 2 + i * 0.3, 0, i * 0.5]}
            visible={false}
          >
            <ringGeometry args={[0.8, 1, 32]} />
            <meshStandardMaterial 
              color={['#ffff00', '#ff6600', '#ff0066'][i]}
              emissive={['#ffff00', '#ff6600', '#ff0066'][i]}
              emissiveIntensity={3}
              transparent
              opacity={0.8}
              side={2}
            />
          </mesh>
        ))}
        
        {/* Ana patlama parçacıkları */}
        {sparkPositions.map((spark, i) => (
          <mesh 
            key={i}
            ref={el => sparkRefs.current[i] = el}
            position={[0, 0, 0]}
          >
            <sphereGeometry args={[spark.size, 8, 8]} />
            <meshStandardMaterial 
              color={spark.color}
              emissive={spark.color}
              emissiveIntensity={3}
              transparent
              opacity={1}
            />
          </mesh>
        ))}
        
        {/* İkincil mini patlamalar */}
        {secondarySparks.map((spark, i) => (
          <mesh 
            key={`secondary-${i}`}
            ref={el => secondarySparkRefs.current[i] = el}
            position={[spark.x, spark.y, spark.z]}
            visible={false}
          >
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial 
              color={spark.color}
              emissive={spark.color}
              emissiveIntensity={4}
              transparent
              opacity={1}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

