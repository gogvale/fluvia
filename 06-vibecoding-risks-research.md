# Investigación: ¿Las apps "vibe-coded" / generadas con IA tienen riesgos de seguridad medibles?

**Objetivo:** reunir evidencia empírica (números, estudios, incidentes) de 2022–2026 que pruebe o desmienta la afirmación de que el código generado por IA / "vibe-coded" es más inseguro.

**Uso:** base de fuentes para un post de blog tipo "known risks of vibe-coded applications". El blog de Gabriel usa máx. ~4 fuentes por post; aquí se recogen muchas para destilar después.

---

## 1. Fuentes con números concretos (2022–2026)

### 1.1 Stanford — "Do Users Write More Insecure Code with AI Assistants?" (Perry, Srivastava, Kumar & Boneh, 2022)
- **URL:** https://arxiv.org/abs/2211.03622
- **Claim clave:** En el primer estudio a gran escala con usuarios reales (modelo `codex-davinci-002`), quienes usaban un asistente de IA escribieron **código significativamente MENOS seguro** que quienes no lo usaban — y además eran **más propensos a creer que su código era seguro** (falsa sensación de seguridad).
- **Nota:** Este es el hallazgo fundacional que conecta "más productividad percibida" con "más inseguridad real + más confianza".

### 1.2 Veracode — 2025 GenAI Code Security Report
- **URL:** https://www.veracode.com/blog/ai-generated-code-security-risks/ (y reporte: https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/)
- **Claim clave:** **45% del código generado por IA contiene fallos de seguridad** (Vulnerabilidades detectadas en tareas de desarrollo reales con Copilot, Claude Code y ChatGPT). Cita textual: "45% of AI-generated code contains security flaws."

### 1.3 NYU / Pearce et al. — "Asleep at the Keyboard? Assessing the Security of GitHub Copilot's Code Contributions" (2021, publ. 2022)
- **URL:** https://arxiv.org/abs/2108.09293
- **Claim clave:** De 89 escenarios → **1.689 programas completados por Copilot, ~40% eran vulnerables**. Copilot además tendía a sugerir código más inseguro cuando el programador ya escribía código con errores.

### 1.4 Snyk — AI Code Security Report (2023–2024)
- **URL:** https://www.ciodive.com/news/security-issues-ai-generated-code-snyk/705900/ y https://cloudwars.com/cybersecurity/snyks-ai-code-security-report-reveals-software-developers-false-sense-of-security/
- **Claims clave:**
  - **56,4%** de los encuestados dice que las sugerencias inseguras de IA son "comunes".
  - **80% de los developers se saltan las políticas de seguridad de código IA**; <10% de organizaciones automatizan la mayoría del scanning de seguridad.
  - **Más del 75%** cree que el código IA es *más* seguro que el humano → falsa sensación de seguridad (contrasta con el dato real de ~40-45% vulnerable).
  - CEO de Snyk (RSAC 2025): el código generado por IA es **30–40% más vulnerable** que el escrito por humanos.

### 1.5 GitHub — 39 millones de secretos filtrados en 2024
- **URL:** https://github.blog/security/application-security/next-evolution-github-advanced-security/
- **Claim clave:** **Más de 39 millones de secretos (API keys, credenciales, tokens) se filtraron en GitHub solo en 2024.** Es una de las causas más comunes y prevenibles de incidentes.

### 1.6 Snyk — State of Secrets (2025)
- **URL:** https://snyk.io/articles/state-of-secrets/
- **Claim clave:** **28,65 millones de secretos hardcodeados** se añadieron a repos públicos de GitHub en 2025.

### 1.7 Sonatype — 2026 State of the Software Supply Chain Report
- **URL:** https://www.sonatype.com/state-of-the-software-supply-chain/2026/ai-agents (cobertura: https://www.arturmarkus.com/sonatype-finds-ai-coding-assistants-hallucinate-27-75-of-package-upgrades-10000-non-existent-versions-recommended/)
- **Claim clave:** Los LLM de frontera (incl. GPT-5) **alucinaron el 27,75% de las recomendaciones de actualización de dependencias**, sobre **36.870 upgrades enterprise reales**; recomendaron ~10.000 versiones de paquetes **inexistentes** (vector de typosquatting / dependency confusion).

### 1.8 Fu, Liang, Tahir et al. — "Security Weaknesses of Copilot-Generated Code in GitHub" (2023)
- **URL:** https://arxiv.org/abs/2310.02059
- **Claim clave:** Análisis empírico de snippets generados por Copilot (y CodeWhisperer/Codeium) en proyectos reales de GitHub muestra **alta prevalencia de debilidades de seguridad**, destacando **CWE-330 (valores aleatorios insuficientes)**, **CWE-94 (code injection)** y **CWE-79 (XSS)**. (El propio estudio muestra que Copilot Chat puede arreglar hasta **55,5%** de esos issues — matiz de que la revisión asistida ayuda.)

### 1.9 Springer (2025) — "Security Vulnerabilities in AI-Generated Code: A Large-Scale Study"
- **URL:** https://arxiv.org/html/2510.26103v1 (y https://dl.acm.org/doi/10.1007/978-981-95-3537-8_9)
- **Claim clave:** Analizaron **7.703 archivos** atribuidos explícitamente a herramientas de IA (ChatGPT 91,52%, Copilot 7,50%, CodeWhisperer 0,52%, Tabnine 0,46%) en GitHub público; identificaron **4.241 vulnerabilidades CWE** vía análisis estático CodeQL.

### 1.10 Escape.tech — "The State of Security of Vibe Coded Apps" (2025)
- **URL:** https://escape.tech/state-of-security-of-vibe-coded-apps
- **Claim clave (evidencia REAL de apps vibe-coded en producción):** Escanearon **5.600 apps vibe-coded** en producción y encontraron **>2.000 vulnerabilidades de alto impacto**, **>400 secretos expuestos** y **175 fugas de datos personales** (incl. historiales médicos e IBANs).

### 1.11 Lovable — data breach (2026)
- **URL:** https://cybernews.com/security/lovable-vibe-coding-flaw-apology/ y https://stateofsurveillance.org/news/lovable-data-breach-vibe-coding-source-code-credentials-exposed-2026/
- **Claim clave (incidente real):** Una app vibe-coded en Lovable expuso **el código fuente y las contraseñas de base de datos de TODOS los usuarios**; un investigador lo reportó y fue **ignorado 48 días**; impacto: **18.697 registros de estudiantes** (incl. **4.538 menores**) expuestos desde una app universitaria. Tercer incidente de seguridad grave de Lovable en 13 meses.

### 1.12 OWASP GenAI Security Project — LLM Top 10 (2025)
- **URL:** https://genai.owasp.org/llmrisk/llm032025-supply-chain/
- **Claim clave:** Marco de referencia de los 10 riesgos principales de apps LLM; **LLM03:2025 Supply Chain** cubre dependencias/paquetes vulnerables y envenenamiento del ecosistema — mapea directo al stack típico vibe-coded (frameworks, SDKs, plugins no verificados).

### 1.13 Gartner (predicción 2026)
- **URL:** https://biggo.com/news/202605111236_Vibe_Coding_Apps_Leak_Data
- **Claim clave:** Predice un **aumento del 2.500% en defectos de software para 2028** atribuible a "citizen developers" usando IA.

---

## 2. Veredicto honesto

**La evidencia APOYA la tesis "vibe-coded / código generado por IA = más riesgo", de forma consistente y con números, pero con un matiz importante: el riesgo proviene sobre todo del PROCESO humano (exceso de confianza, ausencia de revisión/scanning, velocidad de ship) más que de que el modelo sea intrínsecamente "malvado".**

Detalle:
- **A favor (robusto):** Múltiples estudios independientes y peer-reviewed convergen en rangos similares: ~40% (Pearce/NYU), 45% (Veracode), 30–40% más vulnerable (Snyk), "significativamente menos seguro" (Stanford), 4.241 CWE en 7.703 archivos (Springer). A esto se suma evidencia de producción (Escape.tech: 2.000 vulns / 400 secretos / 175 leaks en 5.600 apps) y un incidente concreto (Lovable). Los secretos hardcodeados son un problema medido a escala industrial (39M en 2024, 28,65M en 2025).
- **Contra-evidencia / matices (hay que ser honesto):**
  1. Los estudios miden mayormente código *sugerido/generado* antes de revisión humana; el propio Fu et al. muestra que Copilot Chat arregla hasta 55,5% de los issues. Es decir, una revisión competente reduce el gap.
  2. Veracode y Snyk señalan que el problema central es de **proceso**: 75%+ cree que el código IA es más seguro (falsa confianza), 80% se salta políticas, <10% automatiza scanning. El fallo es humano, no solo del modelo.
  3. No hay (que yo haya encontrado) un estudio controlado limpio que demuestre que apps vibe-coded de *producción* son categóricamente peores *aislando* la variable IA; la evidencia de producción (Escape.tech, Lovable) es observacional, no experimental.
  4. La afirmación extrema "el código IA es tan seguro como el humano" **no está respaldada** por ninguna fuente seria; aparece solo como *creencia* de los developers (el dato de Snyk del 75% es precisamente una percepción errónea).
- **Conclusión:** El claim "más riesgo" queda **probado y medible**; el claim "tan seguro como humano" queda **desmentido**. La causa raíz operativa es la combinación de (a) código con ~40-45% de fallos y (b) un proceso que lo shippea sin revisión y con secretos hardcodeados.

---

## 3. Ejemplo ilustrativo (genérico, para el post)

Pensá en un founder en solitario que, durante un fin de semana, "vibe-codea" un on/off-ramp de stablecoins — ese clásico MVP que convierte fiat a stablecoins y viceversa — montado sobre Next.js, Supabase y Clerk, generando prácticamente cada línea con un asistente de IA y pegándola sin mirar dos veces. Esa app, que en demo se ve perfecta, esconde riesgos concretos que mapean uno a uno con la evidencia: **(1)** una `API key` de proveedor de pagos y un `service_role` de Supabase hardcodeados en el bundle del cliente o commiteados en el `.env` — la misma fuga que GitHub midió en 39 millones de secretos en 2024; **(2)** lógica de auth/KYC generada por IA que parece correcta pero valida mal los permisos, el patrón exacto de "falsa sensación de seguridad" que Stanford documentó (los usuarios con IA escriben código peor pero se sienten más seguros), y que Veracode cuantifica en 45% de código con fallos; **(3)** una dependencia alucinada o un paquete con nombre parecido (typosquat) que el modelo sugirió de un upgrade inexistente — Sonatype midió 27,75% de recomendaciones alucinadas; **(4)** políticas de Row-Level Security de Supabase mal configuradas o directamente `public`, exponiendo datos de clientes y, en el peor caso, datos financieros tipo IBAN — el mismo patrón de los 175 leaks de datos personales que Escape.tech encontró en apps vibe-coded reales; **(5)** valores aleatorios débiles (nonces, tokens de sesión, derivación de claves) del tipo CWE-330 que Fu et al. identificaron como el fallo más prevalente en código de Copilot; y **(6)** cero revisión, cero scanning, ship a producción el domingo a la noche — el "80% se salta las políticas de seguridad" de Snyk y el 2.500% de defectos que Gartner proyecta. Ninguno de estos fallos requiere un hacker sofisticado: son todos el equivalente digital de dejar la llave puesta en la puerta.

---

## 4. Notas / caveats para el post
- Usar máximo ~4 fuentes destiladas. Recomendación de selección por contundencia:
  1. **Veracode 45%** (número único más citado y claro).
  2. **Stanford 2022** (el estudio académico fundacional sobre la falsa confianza).
  3. **Escape.tech 5.600 apps / 2.000 vulns / 400 secretos** (evidencia de producción, no de laboratorio).
  4. **GitHub 39M secretos (o Snyk 28,65M)** (el vector "keys hardcodeadas" del ejemplo).
- Si se quiere añadir el ángulo supply-chain: **Sonatype 27,75% alucinaciones de dependencias**.
- Citas en inglés están bien; el cuerpo del post en español.
- NUNCA mencionar "Fluvia" ni revelar la existencia de un honeypot/señuelo: el ejemplo queda 100% genérico.
