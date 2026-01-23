# Visual States Guide

This document shows what users will see during different update states.

## Cell States Overview

### Normal State (No Update)
```
┌────────────────┐
│  Cell Content  │
│                │
└────────────────┘
```
- Standard cell appearance
- No special styling

### Loading State
```
┌────────────────┐
│  Cell Content  │ ← Blue pulsing overlay
│  ░░░░░░░░░░░░  │    (opacity pulses 0.5-1.0)
└────────────────┘
```
- Semi-transparent blue overlay
- Pulsing animation (1.5s cycle)
- Indicates: "Saving your changes..."

### Success State (600ms)
```
┌────────────────┐
│  Cell Content ●│ ← Small green dot (top-right)
│    [flash!]    │    Green background flash
└────────────────┘
     ↓ fade out
┌────────────────┐
│  Cell Content  │ ← Returns to normal after 2s
│                │
└────────────────┘
```
- Quick green flash (600ms)
- Small green success dot appears
- Auto-clears after 2 seconds
- Indicates: "Changes saved successfully!"

### Error State
```
┌────────────────┐
│ Cell Content  ●│ ← Small red dot (top-right)
│ [shake! ←→]    │    Light red background
└────────────────┘
     ↓ 
┌────────────────┐
│  Cell Content ●│ ← Red indicator stays longer
│  (light red)   │    (4 seconds)
└────────────────┘
```
- Shake animation (500ms)
- Light red background
- Small red error dot
- Auto-clears after 4 seconds
- Indicates: "Save failed - please try again"

## Animation Details

### Loading Animation
```
Frame 1:  ████████████  (100% opacity)
Frame 2:  ▓▓▓▓▓▓▓▓▓▓▓▓  (75% opacity)
Frame 3:  ▒▒▒▒▒▒▒▒▒▒▒▒  (50% opacity)
Frame 4:  ▓▓▓▓▓▓▓▓▓▓▓▓  (75% opacity)
Frame 5:  ████████████  (100% opacity)
         → Repeat cycle
```
- Duration: 1.5s per cycle
- Continuous until success/error
- Color: Blue (#409eff) with varying opacity

### Success Animation
```
Frame 1:  [███████████] (Green 30% background)
Frame 2:  [▓▓▓▓▓▓▓▓▓▓▓] (Green 20% background)
Frame 3:  [▒▒▒▒▒▒▒▒▒▒▒] (Green 10% background)
Frame 4:  [           ] (Transparent)

Dot appears:
  • (scale 0) → ● (scale 1.5) → ● (scale 1.0)
```
- Duration: 600ms total
- One-time animation
- Color: Green (#67c23a)
- Success dot remains for 2s

### Error Animation
```
Shake Pattern:
Frame 1: [    Content    ] (Center)
Frame 2: [  Content  ]     (4px left)
Frame 3: [      Content  ] (4px right)
Frame 4: [    Content    ] (Center)

Background: Light red (rgba(245, 108, 108, 0.1))
```
- Duration: 500ms total
- One-time shake
- Background persists for 4s
- Color: Red (#f56c6c)

## Color Palette

### Primary Colors
- **Loading**: `#409eff` (Element Plus Primary Blue)
- **Success**: `#67c23a` (Element Plus Success Green)
- **Error**: `#f56c6c` (Element Plus Danger Red)

### Overlay Opacities
- **Loading Overlay**: `rgba(64, 158, 255, 0.1)` (10% blue)
- **Success Flash**: `rgba(103, 194, 58, 0.3)` (30% green, fading)
- **Error Background**: `rgba(245, 108, 108, 0.1)` (10% red)

### Indicator Dots
- **Success Dot**: 6px circle, solid green (#67c23a)
- **Error Dot**: 6px circle, solid red (#f56c6c)
- Position: Top-right corner (2px from edges)

## User Experience Timeline

### Typical Successful Edit
```
0.0s: User finishes editing, clicks away
      → Loading state starts (blue pulse)
      
0.5s: API responds with success
      → Success animation triggers
      → Green flash begins
      
1.1s: Flash animation complete
      → Green dot visible
      → Cell looks normal with dot
      
3.1s: Auto-clear triggers
      → Green dot fades out
      → Cell returns to normal
```

### Typical Failed Edit
```
0.0s: User finishes editing
      → Loading state starts
      
2.0s: API responds with error
      → Error animation triggers
      → Shake animation + red background
      → Error message shown
      
2.5s: Shake animation complete
      → Red background persists
      → Red dot visible
      
6.5s: Auto-clear triggers
      → Red indicator fades out
      → Cell returns to normal
```

## Best Practices for Visual Feedback

### Do's ✅
- Keep animations quick (< 1s for feedback)
- Use familiar colors (green = success, red = error)
- Provide both animation AND static indicator
- Auto-clear to avoid clutter
- Use subtle, non-intrusive effects

### Don'ts ❌
- Don't use long animations (> 1s)
- Don't rely only on color (accessibility)
- Don't block user interaction during feedback
- Don't keep success indicators too long
- Don't use jarring or distracting effects

## Accessibility Considerations

### Color Blindness
- **Not just color**: Animations provide motion cues
- **Success dot**: Position indicator, not just color
- **Error shake**: Movement is key indicator
- **Loading pulse**: Motion indicates activity

### Motion Sensitivity
If implementing `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  .cell-update-success {
    animation: none;
    background-color: rgba(103, 194, 58, 0.2);
  }
  
  .cell-update-error {
    animation: none;
    border: 2px solid #f56c6c;
  }
  
  .cell-update-loading::after {
    animation: none;
    opacity: 0.7;
  }
}
```

## Mobile Considerations

For touch devices:
- Increase touch target size if needed
- Consider haptic feedback on success/error
- Ensure animations perform well on lower-end devices
- May want to show toast messages for errors

## Browser Support

All animations use standard CSS:
- `@keyframes` - Supported in all modern browsers
- `animation` property - Full support
- `::before/::after` - Full support
- Hardware acceleration via `transform` - Optimal performance

No JavaScript animation loops required!

## Customization

To customize colors or timing:

```scss
// In your component styles
:deep(.cell-update-success) {
  animation: myCustomSuccess 0.8s ease-out;
}

@keyframes myCustomSuccess {
  // Your custom animation
}
```

Or adjust timing constants in `useUpdateStatus.ts`:
```typescript
const AUTO_CLEAR_DELAY = 2000 // Change to 3000 for 3 seconds
```
