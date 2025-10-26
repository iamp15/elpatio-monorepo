# Paleta de Colores "El Patio" 🏠

## Concepto

La paleta de colores de "El Patio" está inspirada en los elementos naturales y cálidos de un patio de juegos tradicional, donde los amigos se reúnen para pasar un rato divertido. Los colores evocan sensaciones de calidez, diversión y nostalgia.

## Colores Principales

### 🟢 Verde Pasto

- **Principal**: `#4CAF50` (`--patio-verde-pasto`)
- **Oscuro**: `#388E3C` (`--patio-verde-pasto-oscuro`)
- **Suave**: `rgba(76, 175, 80, 0.1)` (`--patio-verde-suave`)

**Uso**: Botones principales, elementos de éxito, estados positivos.

### 🔴 Rojo Ladrillo

- **Principal**: `#E57373` (`--patio-rojo-ladrillo`)
- **Oscuro**: `#D32F2F` (`--patio-rojo-ladrillo-oscuro`)
- **Suave**: `rgba(229, 115, 115, 0.1)` (`--patio-rojo-suave`)

**Uso**: Botones de peligro, alertas, elementos de error.

### 🟤 Marrón Madera

- **Principal**: `#8D6E63` (`--patio-marron-madera`)
- **Claro**: `#A1887F` (`--patio-marron-madera-claro`)

**Uso**: Textos principales, elementos de navegación, fondos cálidos.

## Colores de Acento

### 🟡 Amarillo Sol

- **Principal**: `#FFC107` (`--patio-amarillo-sol`)
- **Suave**: `rgba(255, 193, 7, 0.1)` (`--patio-amarillo-suave`)

**Uso**: Destacados, advertencias, elementos de atención.

### 🔵 Azul Cielo

- **Principal**: `#2196F3` (`--patio-azul-cielo`)
- **Suave**: `rgba(33, 150, 243, 0.1)` (`--patio-azul-suave`)

**Uso**: Enlaces, información secundaria, elementos de navegación.

### ⚪ Gris Piedra

- **Principal**: `#9E9E9E` (`--patio-gris-piedra`)

**Uso**: Elementos deshabilitados, textos secundarios.

### ☁️ Blanco Nube

- **Principal**: `#FAFAFA` (`--patio-blanco-nube`)

**Uso**: Fondos de tarjetas, elementos elevados.

## Implementación CSS

### Variables CSS

```css
:root {
  /* Colores principales del patio */
  --patio-verde-pasto: #4caf50;
  --patio-verde-pasto-oscuro: #388e3c;
  --patio-rojo-ladrillo: #e57373;
  --patio-rojo-ladrillo-oscuro: #d32f2f;
  --patio-marron-madera: #8d6e63;
  --patio-marron-madera-claro: #a1887f;

  /* Colores de acento */
  --patio-amarillo-sol: #ffc107;
  --patio-azul-cielo: #2196f3;
  --patio-gris-piedra: #9e9e9e;
  --patio-blanco-nube: #fafafa;

  /* Variantes para estados */
  --patio-verde-suave: rgba(76, 175, 80, 0.1);
  --patio-rojo-suave: rgba(229, 115, 115, 0.1);
  --patio-amarillo-suave: rgba(255, 193, 7, 0.1);
  --patio-azul-suave: rgba(33, 150, 243, 0.1);
}
```

## Guía de Uso

### Botones

- **Primarios**: Verde pasto
- **Secundarios**: Azul cielo
- **Peligro**: Rojo ladrillo
- **Advertencia**: Amarillo sol
- **Deshabilitado**: Gris piedra

### Fondos

- **Principal**: Blanco nube
- **Secundario**: Verde suave, azul suave
- **Gradientes**: Verde pasto a azul cielo

### Textos

- **Principal**: Marrón madera
- **Secundario**: Gris piedra
- **Enlaces**: Azul cielo

## Archivos Actualizados

La paleta de colores "El Patio" está implementada en:

1. `elpatio-miniapps/depositos/styles.css`
2. `elpatio-miniapps/cajeros/styles.css`
3. `bot-telegram/webapps/deposito/styles.css`
4. `elpatio-miniapps/index.html`

## Consideraciones de Accesibilidad

- Todos los colores cumplen con los ratios de contraste WCAG 2.1 AA
- Las variantes suaves se usan para fondos y estados hover
- Los colores oscuros se usan para textos sobre fondos claros

## Inspiración

Esta paleta evoca:

- 🌱 La frescura del pasto verde
- 🧱 La calidez del ladrillo rojo
- 🌳 La solidez de la madera marrón
- ☀️ La alegría del sol amarillo
- 🌤️ La serenidad del cielo azul

---

_Última actualización: Diciembre 2024_
