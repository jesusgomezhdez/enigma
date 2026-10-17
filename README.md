# Enigma I — simulador 3D interactivo

Un simulador fiel de la **máquina Enigma I** que usaron el ejército (Heer) y la fuerza aérea (Luftwaffe) alemanes durante la Segunda Guerra Mundial, hecho para **aprender cómo funcionaba manejándola**, como si la tuvieras delante sobre la mesa.

No es una caja de texto que cifra al pulsar un botón. Es la máquina: abres la caja, eliges y colocas los rotores, ajustas sus anillos, conectas los cables del tablero, giras las ruedas hasta la posición inicial y tecleas letra a letra mientras se enciende una lámpara.

> **Proyecto educativo.** Su fin es enseñar historia de la criptografía y los principios mecánicos y matemáticos de la Enigma. No lo uses para proteger información real: el cifrado Enigma se rompió hace más de ochenta años.

---

## Qué se aprende

- **Cómo una máquina electromecánica cifra:** el recorrido de la corriente desde la tecla hasta la lámpara, pasando por el tablero de clavijas, tres rotores, el reflector y vuelta.
- **Por qué cifrar y descifrar es la misma operación:** con la misma configuración, si `A` da `K`, `K` da `A`. El receptor solo tiene que teclear el mensaje cifrado.
- **Por qué una letra nunca se cifra como sí misma.** Es una consecuencia del reflector, y fue una debilidad clave que aprovecharon los criptoanalistas de Bletchley Park.
- **El avance de los rotores y el doble paso,** la anomalía mecánica que hace que el rotor central avance dos veces seguidas.
- **Qué es cada parte de la clave diaria,** tal como aparecía en las hojas de claves:

| Término alemán | Qué es | Dónde se ajusta en el simulador |
|---|---|---|
| **Walzenlage** | Qué rotores se usan y en qué orden | Vista *Interior*: sacar y meter rotores |
| **Ringstellung** | Posición del anillo de cada rotor respecto a su cableado | Vista *Interior*: girar el anillo de un rotor que está en la caja |
| **Steckerverbindungen** | Pares de letras conectados con cables | Vista *Clavijas*: arrastrar cables |
| **Grundstellung** | Posición inicial de los rotores | Ruedas dentadas que asoman por la tapa |
| **Umkehrwalze (UKW)** | Reflector en uso (A, B o C) | Vista *Interior*: cambiar el reflector |

---

## Cómo usarla

```bash
pnpm install
pnpm dev
```

Abre la dirección que muestra Vite (normalmente `http://localhost:5173`).

### Controles

| Acción | Cómo |
|---|---|
| Teclear | Con el teclado del ordenador, o pulsando las teclas de la máquina. La lámpara luce **mientras mantengas la tecla pulsada**. |
| Girar la cámara | Arrastrar sobre la escena. La rueda del ratón acerca y aleja. |
| Ir a una zona | Botones *Máquina*, *Rotores*, *Interior* y *Clavijas*. |
| Fijar la posición inicial | Arrastrar en vertical una rueda dentada, o usar la rueda del ratón sobre ella. |
| Abrir la tapa interior | Pestillo niquelado del borde delantero de la tapa de los rotores, o vista *Interior*. |
| Sacar o meter un rotor | Con la tapa interior abierta, clic en el rotor. |
| Ajustar la Ringstellung | Arrastrar el anillo de un rotor **que esté en la caja**. El número junto al clip rojo es el ajuste. |
| Cambiar el reflector | Con la tapa interior abierta, clic en el reflector instalado y después en otro de su caja. |
| Conectar un cable | Abrir la tapa frontal y arrastrar de una clavija libre a otra. Para quitar un cable, arrastrar su enchufe y soltarlo fuera. |
| Cerrar o abrir la caja | Botón *Cerrar caja*, o clic en la tapa de madera. |

Como en la máquina real, hay cosas que no se pueden hacer:
- Con una tecla pulsada no se pueden girar rotores ni tocar cables.
- Con la caja cerrada no se puede teclear.
- Si falta un rotor o el reflector, el circuito queda abierto: la tecla baja pero no se enciende nada.

### Ejercicio 1: tu primer mensaje

1. Deja la configuración inicial: UKW B, rotores I II III, anillos `01 01 01`, sin cables y posición `01 01 01`.
2. Teclea `AAAAA`. Las lámparas darán **`BDZGO`**.
3. Pulsa *Borrar*, vuelve a poner las tres ruedas en `01` y teclea `BDZGO`. Recuperas `AAAAA`.

Fíjate en que la misma letra repetida da letras distintas, porque los rotores avanzan con cada pulsación, y en que ninguna `A` se convierte en `A`.

### Ejercicio 2: descifrar un mensaje real de 1941

Este mensaje se envió el 7 de julio de 1941, durante la Operación Barbarossa. El simulador lo descifra exactamente; está incluido en los tests.

**Clave del día:**

| | |
|---|---|
| UKW | B |
| Walzenlage | II IV V |
| Ringstellung | 02 21 12 |
| Stecker | AV BS CG DL FU HZ IN KM OW RX |

**Paso 1, la clave del mensaje.** Pon las ruedas en `23 24 03` (W X C) y teclea `KCH`. Las lámparas darán `BLA`, es decir, `02 12 01`. Esa es la posición inicial del mensaje, elegida por el operador emisor.

**Paso 2, el texto.** Pon las ruedas en `02 12 01` y teclea:

```
EDPUD NRGYS ZRCXN UYTPO MRMBO FKTBZ REZKM LXLVE FGUEY SIOZV
EQMIK UBPMM YLKLT TDEIS
```

Obtendrás `AUFKLXABTEILUNGXVONXKURTINOWAXKURTINOWAXNORDWESTLXSEBEZ…`, que leído es *"Aufkl. Abteilung von Kurtinowa, Kurtinowa nordwestl. Sebez…"* (un informe de un batallón de reconocimiento). La `X` sustituía al punto y a los espacios: la Enigma no tenía teclas para ellos.

---

## Cómo funciona la Enigma

### El recorrido de la corriente

Al pulsar una tecla, la corriente recorre:

```
Tecla → Tablero → Rueda de entrada → Rotor derecho → Rotor central → Rotor izquierdo
      → Reflector
      → Rotor izquierdo → Rotor central → Rotor derecho → Rueda de entrada → Tablero → Lámpara
```

- **Tablero de clavijas (Steckerbrett):** intercambia pares de letras. Con 10 cables hay unos 150 billones de combinaciones posibles; es la parte que más aportaba a la seguridad.
- **Rotores (Walzen):** cada uno es un disco con 26 contactos en cada cara, cableados de forma desordenada. Es una permutación fija del alfabeto que cambia a medida que el rotor gira.
- **Reflector (Umkehrwalze):** une las letras por pares y devuelve la corriente por los rotores. Gracias a él la máquina es recíproca. Por eso mismo **ninguna letra puede cifrarse como sí misma**: el camino de vuelta nunca coincide con el de ida.

### El avance de los rotores

Cada pulsación hace avanzar el rotor derecho **antes** de que se cierre el contacto. Cuando un rotor pasa por su muesca, empuja al de su izquierda, como un cuentakilómetros. Pero hay un detalle mecánico: el trinquete que empuja al rotor izquierdo actúa sobre la muesca del central, así que este avanza también por su cuenta. Es el **doble paso**. Por eso el ciclo completo es de 26 × 25 × 26 = **16 900** pulsaciones, y no de 26³ = 17 576.

### La Ringstellung

El anillo con los números (01 a 26) puede girarse respecto al cableado interior. Así, lo que se ve en la ventanilla no revela directamente la posición del cableado. El simulador lo modela como el aparato real: con el rotor fuera de la máquina, giras el anillo contra el núcleo fijo y lees el ajuste junto al clip.

---

## Fidelidad histórica y simplificaciones

**Fiel al original:**
- Cableados reales de los rotores I a V y de los reflectores A, B y C.
- Muescas de avance y doble paso.
- Rotores marcados con números del 01 al 26, como en la Enigma I.
- Teclado y lámparas en orden QWERTZ.
- 10 cables, como pedían las hojas de claves desde 1939.
- Bloqueo mecánico de las teclas y circuito abierto si falta una pieza.

**Simplificado:**
- No está modelada la palanca que libera el eje de los rotores: se sacan con un clic.
- Las etiquetas del tablero de clavijas son letras. Falta contrastarlo con fotografías de unidades reales de la Enigma I.
- La geometría es una interpretación a escala, no un escaneo de una máquina real.
- El motor ya soporta la **M3** (Kriegsmarine) y la **M4** (submarinos), pero la interfaz solo ofrece la Enigma I.

---

## Para desarrolladores

### Tecnologías

- **React 19** con React Compiler, **TypeScript** y **Vite**.
- **three.js** con **React Three Fiber**, **drei** y **postprocessing** para la escena 3D. Toda la geometría y las texturas se generan en código, sin modelos ni imágenes externas.
- **zustand** para el estado.
- **Web Audio API** para los sonidos, sintetizados sin archivos de audio.
- **Vitest** y **fast-check** para los tests. **oxlint** para el lint.

### Estructura

```
src/
├── engine/          Motor de cifrado en TypeScript puro, sin dependencias de UI
│   ├── data.ts      Cableados históricos y modelos (I, M3, M4)
│   ├── machine.ts   Avance, cifrado y traza del recorrido de la señal
│   └── __tests__/   Tests de propiedades y oráculos históricos
├── state/           Store: piezas de la máquina, teclas, cables, tapas, vistas
├── scene/           Escena 3D: caja, teclado, lámparas, rotores, tablero, cajas de piezas
├── audio/           Sonidos mecánicos sintetizados
├── hooks/           Teclado físico y arrastres por pasos
└── ui/              Barra de vistas y configuración, libreta del operador
```

El motor no sabe nada de la interfaz: `pressKey(machine, letra)` devuelve el nuevo estado, la lámpara que se enciende y la traza completa del recorrido de la corriente.

### Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Compilación de producción en `dist/` |
| `pnpm preview` | Sirve la compilación de producción |
| `pnpm test` | Ejecuta los tests una vez |
| `pnpm test:watch` | Tests en modo observación |
| `pnpm lint` | oxlint |

### Tests

El motor se verifica con **tests de propiedades**: en lugar de ejemplos sueltos, se generan miles de configuraciones aleatorias y se comprueba que siempre se cumplan las leyes de la máquina:

- Cifrar dos veces devuelve el texto original.
- Ninguna letra se cifra como sí misma.
- Los rotores son permutaciones y los reflectores son involuciones sin puntos fijos.
- El rotor derecho avanza en cada pulsación, se produce el doble paso y el periodo es de 16 900.
- Desplazar a la vez el anillo y la posición no cambia el resultado.

Como estas propiedades no detectarían un cableado mal copiado, hay además **oráculos históricos**:
- El mensaje de Barbarossa de arriba.
- El vector `AAAAA → BDZGO`.
- La compatibilidad M4/M3, que fija los cableados de los rotores delgados de la M4.

---

## Fuentes

- [Crypto Museum: Enigma](https://www.cryptomuseum.com/crypto/enigma/): referencia técnica y fotográfica.
- [Wikipedia: Enigma rotor details](https://en.wikipedia.org/wiki/Enigma_rotor_details): cableados y muescas.
- Dirk Rijmenants, *Enigma Technical Manual* y sus notas sobre procedimientos.
- Frode Weierud, CryptoCellar: mensajes históricos, incluido el de la Operación Barbarossa.
