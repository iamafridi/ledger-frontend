"use client";

import React, { useRef, useState, Suspense, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Sphere, MeshDistortMaterial, Html } from "@react-three/drei";
import * as THREE from "three";

interface Particle {
  id: number;
  from: [number, number, number];
  to: [number, number, number];
  progress: number;
  speed: number;
  color: string;
}

// 3D Account Node Component with resilient HTML overlay tag
function AccountNode({
  position,
  code,
  name,
  balance,
  color,
  shape = "box",
  active,
  onClick,
}: {
  position: [number, number, number];
  code: string;
  name: string;
  balance: string;
  color: string;
  shape?: "box" | "cylinder" | "octahedron";
  active?: boolean;
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.01;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.1;
    if (active) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 6) * 0.18;
    } else {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.06;
    }
  });

  return (
    <group position={position}>
      <Float speed={2.5} rotationIntensity={0.3} floatIntensity={0.4}>
        {/* Core 3D Geometry */}
        <mesh
          ref={meshRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={onClick}
          scale={hovered ? 1.2 : active ? 1.15 : 1}
        >
          {shape === "box" && <boxGeometry args={[1.1, 1.1, 1.1]} />}
          {shape === "cylinder" && <cylinderGeometry args={[0.65, 0.65, 1.2, 24]} />}
          {shape === "octahedron" && <octahedronGeometry args={[0.85]} />}

          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered || active ? 0.9 : 0.35}
            roughness={0.15}
            metalness={0.85}
          />
        </mesh>

        {/* Outer glowing wireframe cage */}
        <mesh scale={hovered ? 1.35 : active ? 1.3 : 1.2}>
          {shape === "box" && <boxGeometry args={[1.1, 1.1, 1.1]} />}
          {shape === "cylinder" && <cylinderGeometry args={[0.65, 0.65, 1.2, 16]} />}
          {shape === "octahedron" && <octahedronGeometry args={[0.85]} />}
          <meshBasicMaterial color={color} wireframe transparent opacity={hovered || active ? 0.75 : 0.25} />
        </mesh>

        {/* Crisp HTML Label Tag */}
        <Html position={[0, -1.05, 0]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              background: "rgba(13, 17, 22, 0.88)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${hovered || active ? color : "rgba(255, 255, 255, 0.15)"}`,
              padding: "4px 8px",
              borderRadius: "6px",
              boxShadow: hovered || active ? `0 0 16px ${color}60` : "0 4px 10px rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
              userSelect: "none",
              transition: "all 0.2s ease",
            }}
          >
            <span
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: "11px",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.04em",
              }}
            >
              {code}
            </span>
            <span
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: "10px",
                fontWeight: 800,
                color: color,
              }}
            >
              {balance}
            </span>
          </div>
        </Html>
      </Float>
    </group>
  );
}

// Flowing Particle Stream Between Nodes
function ParticleStream({ particles, onComplete }: { particles: Particle[]; onComplete: (id: number) => void }) {
  useFrame(() => {
    particles.forEach((p) => {
      p.progress += p.speed;
      if (p.progress >= 1) {
        onComplete(p.id);
      }
    });
  });

  return (
    <>
      {particles.map((p) => {
        const x = THREE.MathUtils.lerp(p.from[0], p.to[0], Math.max(0, Math.min(1, p.progress)));
        const y =
          THREE.MathUtils.lerp(p.from[1], p.to[1], Math.max(0, Math.min(1, p.progress))) +
          Math.sin(Math.max(0, Math.min(1, p.progress)) * Math.PI) * 1.1;
        const z = THREE.MathUtils.lerp(p.from[2], p.to[2], Math.max(0, Math.min(1, p.progress)));

        return (
          <mesh key={p.id} position={[x, y, z]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshBasicMaterial color={p.color} />
          </mesh>
        );
      })}
    </>
  );
}

// Center Double-Entry Scales
function CentralLedgerCore() {
  const coreRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!coreRef.current) return;
    coreRef.current.rotation.y = state.clock.elapsedTime * 0.35;
  });

  return (
    <group ref={coreRef} position={[0, 0, 0]}>
      {/* Central Hologram Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.8, 2.92, 64]} />
        <meshBasicMaterial color="#b8ff2e" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.8, 3.88, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>

      {/* Central Pulsing Sphere */}
      <Float speed={3} rotationIntensity={0.5} floatIntensity={0.4}>
        <Sphere args={[0.55, 32, 32]}>
          <MeshDistortMaterial
            color="#b8ff2e"
            emissive="#3ddc97"
            emissiveIntensity={0.6}
            distort={0.4}
            speed={2.2}
            roughness={0.1}
          />
        </Sphere>
      </Float>

      {/* Central Invariant Tag */}
      <Html position={[0, 0.95, 0]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
        <div
          style={{
            background: "rgba(184, 255, 46, 0.15)",
            border: "1px solid #b8ff2e",
            boxShadow: "0 0 15px rgba(184, 255, 46, 0.4)",
            padding: "4px 10px",
            borderRadius: "999px",
            fontFamily: "ui-monospace, monospace",
            fontSize: "11px",
            fontWeight: 800,
            color: "#b8ff2e",
            whiteSpace: "nowrap",
            letterSpacing: "0.08em",
          }}
        >
          Σ DEBITS = Σ CREDITS
        </div>
      </Html>
    </group>
  );
}

export function Hero3DSimulation() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeTx, setActiveTx] = useState<string | null>("sale");
  const [journalLog, setJournalLog] = useState<string>(
    "[TX-101] Customer Invoice Issued: DR 1100 Accounts Receivable (+৳45,000) ⇄ CR 4000 Revenue (+৳39,130) + CR 2100 VAT (+৳5,870)"
  );

  // Node coordinates in 3D space
  const NODES = {
    bank: [-3.0, 0.4, -0.4] as [number, number, number],
    ar: [3.0, 0.6, -0.4] as [number, number, number],
    inv: [-1.8, -1.6, 1.2] as [number, number, number],
    payroll: [1.8, -1.6, 1.2] as [number, number, number],
    assets: [0, 2.2, -1.2] as [number, number, number],
  };

  const spawnParticles = (from: [number, number, number], to: [number, number, number], color: string, count = 5) => {
    const newItems: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newItems.push({
        id: Date.now() + Math.random() + i,
        from,
        to,
        progress: -i * 0.18,
        speed: 0.028,
        color,
      });
    }
    setParticles((prev) => [...prev, ...newItems]);
  };

  const removeParticle = (id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  };

  // Initial particle stream on load
  useEffect(() => {
    const timer = setTimeout(() => {
      spawnParticles(NODES.ar, NODES.bank, "#D8543D", 5);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Transaction Actions
  const triggerSale = () => {
    setActiveTx("sale");
    setJournalLog("[TX-101] Customer Invoice Issued: DR 1100 Accounts Receivable (+৳45,000) ⇄ CR 4000 Revenue (+৳39,130) + CR 2100 VAT (+৳5,870)");
    spawnParticles(NODES.ar, NODES.bank, "#D8543D", 5);
  };

  const triggerProcurement = () => {
    setActiveTx("procure");
    setJournalLog("[TX-102] Inventory Procurement: DR 1200 Warehouse Stock (+৳25,000) ⇄ CR 2000 Supplier AP (+৳25,000)");
    spawnParticles(NODES.bank, NODES.inv, "#141514", 5);
  };

  const triggerPayroll = () => {
    setActiveTx("payroll");
    setJournalLog("[TX-103] Monthly Staff Payroll Disbursed: DR 5000 Gross Salary (৳60,000) ⇄ CR 1600 Loan Recovery (৳5,000) + CR 1010 Bank (৳55,000)");
    spawnParticles(NODES.bank, NODES.payroll, "#D8543D", 5);
  };

  const triggerDepreciation = () => {
    setActiveTx("depreciation");
    setJournalLog("[TX-104] Fixed Asset Depreciation Run: DR 5200 Dep Expense (+৳3,000) ⇄ CR 1510 Accum Depreciation (+৳3,000)");
    spawnParticles(NODES.assets, NODES.bank, "#D8543D", 4);
  };

  return (
    <div
      className="panel stack"
      style={{
        padding: 0,
        position: "relative",
        background: "linear-gradient(180deg, #0d1116 0%, #07090c 100%)",
        border: "1px solid rgba(184, 255, 46, 0.35)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        boxShadow: "0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(184, 255, 46, 0.12)",
      }}
    >
      {/* 3D Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--s-3) var(--s-4)",
          background: "rgba(19, 24, 32, 0.85)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--line-firm)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#b8ff2e", boxShadow: "0 0 10px #b8ff2e" }} />
          <span className="mono" style={{ fontSize: "var(--t-xs)", fontWeight: 700, color: "var(--ink)" }}>
            3D LEDGER TOPOLOGY SIMULATION
          </span>
        </div>
        <span className="chip chip--ok" style={{ fontSize: "0.625rem", padding: "2px 8px" }}>
          DR / CR Invariant Balancer Active
        </span>
      </div>

      {/* 3D WebGL Canvas */}
      <div style={{ width: "100%", height: "370px", position: "relative" }}>
        <Canvas
          camera={{ position: [0, 1.8, 6.8], fov: 48 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 8, 5]} intensity={1.4} color="#ffffff" />
            <pointLight position={[-5, -4, -5]} intensity={0.9} color="#b8ff2e" />
            <pointLight position={[5, 4, 3]} intensity={1.1} color="#38bdf8" />

            {/* Central Scales & Rings */}
            <CentralLedgerCore />

            {/* Account Nodes in 3D Space */}
            <AccountNode
              position={NODES.bank}
              code="1010 Bank"
              name="Prime Operating Bank"
              balance="৳520,400.00"
              color="#b8ff2e"
              shape="cylinder"
              active={activeTx === "sale" || activeTx === "payroll"}
              onClick={triggerSale}
            />

            <AccountNode
              position={NODES.ar}
              code="1100 AR"
              name="Customer Receivables"
              balance="৳145,000.00"
              color="#38bdf8"
              shape="box"
              active={activeTx === "sale"}
              onClick={triggerSale}
            />

            <AccountNode
              position={NODES.inv}
              code="1200 Inventory"
              name="Warehouse Stock"
              balance="৳85,000.00"
              color="#fbbf24"
              shape="box"
              active={activeTx === "procure"}
              onClick={triggerProcurement}
            />

            <AccountNode
              position={NODES.payroll}
              code="2300 Payroll"
              name="Salary & Staff Loans"
              balance="৳55,000.00"
              color="#a78bfa"
              shape="octahedron"
              active={activeTx === "payroll"}
              onClick={triggerPayroll}
            />

            <AccountNode
              position={NODES.assets}
              code="1500 Assets"
              name="Server & Delivery Van"
              balance="৳570,000.00"
              color="#ff5c48"
              shape="cylinder"
              active={activeTx === "depreciation"}
              onClick={triggerDepreciation}
            />

            {/* Flowing Transaction Particles */}
            <ParticleStream particles={particles} onComplete={removeParticle} />

            {/* User Camera Controls */}
            <OrbitControls
              enableZoom={false}
              maxPolarAngle={Math.PI / 2 + 0.15}
              minPolarAngle={Math.PI / 3}
              rotateSpeed={0.6}
            />
          </Suspense>
        </Canvas>

        {/* Orbit Hint Badge */}
        <div
          style={{
            position: "absolute",
            bottom: "var(--s-2)",
            right: "var(--s-3)",
            background: "rgba(7, 9, 12, 0.8)",
            backdropFilter: "blur(6px)",
            padding: "var(--s-1) var(--s-2)",
            borderRadius: "var(--radius-pill)",
            fontSize: "0.625rem",
            color: "var(--lime)",
            pointerEvents: "none",
            border: "1px solid rgba(184, 255, 46, 0.25)",
          }}
        >
          ↺ Drag to rotate 3D view
        </div>
      </div>

      {/* Interactive Simulation Trigger Bar */}
      <div
        style={{
          padding: "var(--s-3) var(--s-4)",
          background: "var(--surface-2)",
          borderTop: "1px solid var(--line-firm)",
        }}
      >
        <div className="stack" style={{ gap: "var(--s-3)" }}>
          <div className="row" style={{ gap: "var(--s-2)", justifyContent: "center" }}>
            <button
              type="button"
              className={`btn btn--sm ${activeTx === "sale" ? "btn--primary" : "btn--quiet"}`}
              onClick={triggerSale}
              style={{ fontSize: "var(--t-xs)", fontWeight: 700 }}
            >
              1. Post Sale (৳45,000)
            </button>
            <button
              type="button"
              className={`btn btn--sm ${activeTx === "procure" ? "btn--primary" : "btn--quiet"}`}
              onClick={triggerProcurement}
              style={{ fontSize: "var(--t-xs)", fontWeight: 700 }}
            >
              2. Stock Purchase (৳25,000)
            </button>
            <button
              type="button"
              className={`btn btn--sm ${activeTx === "payroll" ? "btn--primary" : "btn--quiet"}`}
              onClick={triggerPayroll}
              style={{ fontSize: "var(--t-xs)", fontWeight: 700 }}
            >
              3. Run Payroll (৳55,000)
            </button>
            <button
              type="button"
              className={`btn btn--sm ${activeTx === "depreciation" ? "btn--primary" : "btn--quiet"}`}
              onClick={triggerDepreciation}
              style={{ fontSize: "var(--t-xs)", fontWeight: 700 }}
            >
              4. Asset Dep (৳3,000)
            </button>
          </div>

          {/* Live Double-Entry Terminal Feed */}
          <div
            style={{
              padding: "var(--s-2) var(--s-3)",
              background: "#07090c",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--line-firm)",
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.6875rem",
              color: "var(--lime)",
              lineHeight: 1.4,
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {journalLog}
          </div>
        </div>
      </div>
    </div>
  );
}
