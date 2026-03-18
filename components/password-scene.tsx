"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { useRef } from "react"
import type { Group, Mesh } from "three"
import { cn } from "@/lib/utils"

function getStrengthColor(strength: number) {
  if (strength < 30) return "#ef4444"
  if (strength < 60) return "#f59e0b"
  if (strength < 80) return "#10b981"
  return "#059669"
}

function PasswordStrengthSphere({ strength }: { strength: number }) {
  const sphereRef = useRef<Mesh | null>(null)

  useFrame(({ clock }, delta) => {
    if (!sphereRef.current) return

    sphereRef.current.rotation.y += delta * 0.45
    sphereRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.45) * 0.2
    sphereRef.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.12
  })

  return (
    <mesh ref={sphereRef}>
      <sphereGeometry args={[0.8, 24, 24]} />
      <meshStandardMaterial
        color={getStrengthColor(strength)}
        metalness={0.65}
        roughness={0.25}
        emissive={getStrengthColor(strength)}
        emissiveIntensity={0.08}
      />
    </mesh>
  )
}

function FloatingLock() {
  const groupRef = useRef<Group | null>(null)

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return

    groupRef.current.rotation.y += delta * 0.35
    groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.08
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.14
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[0.8, 0.6, 0.2]} />
        <meshStandardMaterial color="#059669" metalness={0.75} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <torusGeometry args={[0.2, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#059669" metalness={0.75} roughness={0.2} />
      </mesh>
    </group>
  )
}

export function PasswordScene({ strength, className }: { strength: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("fixed inset-0 h-full w-full", className)}>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 70 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "low-power" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[6, 6, 6]} intensity={1.15} />
        <directionalLight position={[-4, -2, 3]} intensity={0.45} />

        <group position={[1.2, -1.7, 0]}>
          <FloatingLock />
        </group>

        <group position={[4, 0.15, 0]}>
          <PasswordStrengthSphere strength={strength} />
        </group>
      </Canvas>
    </div>
  )
}
