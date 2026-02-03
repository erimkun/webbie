import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Water() {
  const waterRef = useRef()
  
  // Su dalgası animasyonu için shader material
  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  // Su için özel shader - derinlik efektli
  const waterMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDeepColor: { value: new THREE.Color('#1a5276') },
        uShallowColor: { value: new THREE.Color('#5dade2') },
        uFoamColor: { value: new THREE.Color('#aed6f1') },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vElevation;
        varying float vDepth;
        uniform float uTime;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Merkeze uzaklık (derinlik için)
          float distFromCenter = length(uv - 0.5) * 2.0;
          vDepth = 1.0 - distFromCenter;
          
          // Dalga efekti - merkezde daha belirgin
          float wave1 = sin(pos.x * 0.4 + uTime * 0.5) * 0.15 * vDepth;
          float wave2 = sin(pos.y * 0.3 + uTime * 0.4) * 0.1 * vDepth;
          pos.z += wave1 + wave2;
          vElevation = wave1 + wave2;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        uniform vec3 uFoamColor;
        uniform float uTime;
        varying vec2 vUv;
        varying float vElevation;
        varying float vDepth;
        
        void main() {
          // Kenardan merkeze derinlik geçişi
          float depth = smoothstep(0.0, 0.7, vDepth);
          
          // Derinlik renk geçişi (kenar açık, orta koyu)
          vec3 color = mix(uShallowColor, uDeepColor, depth * 0.8);
          
          // Dalga parlaması
          float sparkle = pow(sin(vUv.x * 40.0 + uTime) * sin(vUv.y * 35.0 + uTime * 0.8), 2.0);
          color += sparkle * 0.1 * vec3(1.0, 1.0, 0.9);
          
          // Kenar köpüğü
          float foam = smoothstep(0.85, 1.0, 1.0 - vDepth);
          color = mix(color, uFoamColor, foam * 0.6);
          
          // Saydamlık - kenarlar daha saydam
          float alpha = mix(0.6, 0.95, depth);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    })
  }, [])

  return (
    <group>
      {/* Su altı zemin - derinlik hissi için */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-38, -1.5, 15]}>
        <circleGeometry args={[16, 64]} />
        <meshStandardMaterial color="#0e3d5c" roughness={1} />
      </mesh>
      
      {/* Ana su yüzeyi */}
      <mesh
        ref={waterRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-40, 0.3, 20]}
        material={waterMaterial}
      >
        <circleGeometry args={[18, 64]} />
      </mesh>

      {/* Kumsal - Organik şekilli sahil */}
      <BeachShape />

      {/* Okyanus (uzak görünüm) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-60, -0.5, 5]}>
        <planeGeometry args={[50, 70]} />
        <meshStandardMaterial
          color="#2980b9"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
    </group>
  )
}

// Organik kumsal bileşeni - suyun kenarında
function BeachShape() {
  return (
    <group position={[0, 0.12, 0]}>
      {/* Ana kumsal - suyun ÖNÜNDE ve KENARINDA */}
      {/* Su pozisyonu: [-38, 0.3, 15], yarıçap: 18 */}
      {/* Kumsal suyun sağ tarafında olmalı (çimene geçiş) */}
      
      {/* Sahil şeridi - su ile çim arasında */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-28, 0, 22]}>
        <planeGeometry args={[12, 25]} />
        <meshStandardMaterial color="#f5deb3" roughness={0.85} />
      </mesh>
      
      {/* Islak kum - suyun hemen kenarında */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-32, 0.01, 20]}>
        <planeGeometry args={[8, 22]} />
        <meshStandardMaterial color="#c9a96a" roughness={0.95} />
      </mesh>
      
      {/* Kum tepecikleri - sahil boyunca */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh 
          key={i}
          position={[
            -26 + (i % 2) * 2,
            0.15,
            10 + i * 4
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[1.2 + (i % 2) * 0.5, 12]} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? '#ffe4b5' : '#f5deb3'} 
            roughness={0.9} 
          />
        </mesh>
      ))}
    </group>
  )
}
