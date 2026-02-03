import { useRef, useEffect, useMemo, useState, useContext } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { ScrollContext } from '../App'

export default function Character({ 
  position = [0, 0, 0], 
  scale = 1, 
  rotation = [0, 0, 0], 
  animationFile = '/GolfVurusu.fbx', // FBX animasyon dosyası
  scrollControlled = false, // Scroll ile kontrol edilsin mi
  golfClubFile = null // Golf sopası dosyası (opsiyonel)
}) {
  const group = useRef()
  const mixerRef = useRef()
  const actionRef = useRef()
  const clipRef = useRef()
  const handBoneRef = useRef(null) // El bone referansı
  const { scene } = useGLTF('/ErimChar.glb')
  const [animationLoaded, setAnimationLoaded] = useState(false)
  const { progress } = useContext(ScrollContext) // ScrollContext'ten progress al
  
  // SkeletonUtils.clone kullan
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene])
  
  // Bone isim eşleştirme tablosu
  const boneNameMap = useRef({})
  
  // Bone'ları bul ve eşleştirme tablosunu oluştur
  useEffect(() => {
    const map = {}
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
      if (child.isBone) {
        // LeftUpLeg_057 -> LeftUpLeg eşleştirmesi
        const baseName = child.name.replace(/_\d+$/, '')
        map[baseName] = child.name
        
        // Sağ el bone'unu bul
        if (baseName === 'RightHand') {
          handBoneRef.current = child
          console.log('🖐️ Sağ el bone bulundu:', child.name)
        }
      }
    })
    boneNameMap.current = map
    
    // Tüm bone isimlerini göster
    console.log('🦴 Mevcut bone\'lar:', Object.keys(map).join(', '))
    
    // Mixer oluştur
    mixerRef.current = new THREE.AnimationMixer(clonedScene)
  }, [clonedScene])
  
  // Golf sopası yükle ve ele ekle
  useEffect(() => {
    if (!golfClubFile || !handBoneRef.current) return
    
    const loader = new GLTFLoader()
    loader.load(golfClubFile, (gltf) => {
      const club = gltf.scene
      
      // Golf sopası ayarları
      club.position.set(0.72, 0.43, 0.02)
      club.rotation.set(
        THREE.MathUtils.degToRad(84.5),
        THREE.MathUtils.degToRad(35.7),
        THREE.MathUtils.degToRad(93.2)
      )
      club.scale.set(1.5, 1.5, 1.5)
      
      // El bone'una ekle
      handBoneRef.current.add(club)
      
      console.log('🏌️ Golf sopası ele eklendi!')
    }, undefined, (error) => {
      console.error('Golf sopası yüklenemedi:', error)
    })
  }, [golfClubFile, handBoneRef.current])
  
  // FBX animasyonu yükle
  useEffect(() => {
    if (!animationFile || Object.keys(boneNameMap.current).length === 0) return
    
    const loader = new FBXLoader()
    loader.load(animationFile, (fbx) => {
      if (fbx.animations && fbx.animations.length > 0) {
        let clip = fbx.animations[0]
        
        // Track isimlerini düzelt
        clip.tracks.forEach(track => {
          let newName = track.name.replace(/mixamorig:/g, '')
          newName = newName.replace(/mixamorig/g, '')
          
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
          
          if (scrollControlled) {
            // Scroll kontrolü için - clampWhenFinished ve loop once
            action.setLoop(THREE.LoopOnce)
            action.clampWhenFinished = true
            action.enabled = true
            action.setEffectiveWeight(1)
            action.setEffectiveTimeScale(1)
            action.play()
            // time'ı manuel kontrol edeceğiz
            action.paused = false
          } else {
            // Normal oynatma
            action.setLoop(THREE.LoopRepeat)
            action.play()
          }
          
          actionRef.current = action
          setAnimationLoaded(true)
          
          console.log('✅ Karakter animasyonu yüklendi:', clip.duration.toFixed(2) + 's')
        }
      }
    })
  }, [animationFile, scrollControlled])
  
  // Animasyonu güncelle
  useFrame((state, delta) => {
    if (!mixerRef.current) {
      return
    }
    if (!animationLoaded) {
      return
    }
    
    if (scrollControlled && actionRef.current && clipRef.current) {
      // Action'ın time'ını direkt ayarla - ScrollContext'ten gelen progress kullan
      const targetTime = progress * clipRef.current.duration
      actionRef.current.time = targetTime
      mixerRef.current.update(0)
    } else {
      // Normal oynatma
      mixerRef.current.update(delta)
    }
  })

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  )
}

useGLTF.preload('/ErimChar.glb')
