<template>
  <div class="demo-index">
    <div class="header">
      <h1>Konva Table Rendering POC</h1>
      <p class="subtitle">Canvas-based table rendering with virtual scrolling</p>
    </div>

    <div class="content">
      <div class="overview">
        <div class="overview-card">
          <h2>Project Overview</h2>
          <p>
            This Proof of Concept explores using Konva.js for rendering high-performance, interactive tables within a canvas environment. The goal is to create
            a canvas-based table rendering system with virtual scrolling, editing, filtering, and multiple table support.
          </p>
          <div class="stats">
            <div class="stat">
              <span class="stat-value">10,000+</span>
              <span class="stat-label">Rows Supported</span>
            </div>
            <div class="stat">
              <span class="stat-value">60 FPS</span>
              <span class="stat-label">Target Performance</span>
            </div>
            <div class="stat">
              <span class="stat-value">&lt; 50MB</span>
              <span class="stat-label">Memory Usage</span>
            </div>
          </div>
        </div>

        <div class="features-card">
          <h2>Key Features</h2>
          <ul class="features-list">
            <li>✅ Virtual scrolling for massive datasets</li>
            <li>✅ Canvas-based rendering with Konva.js</li>
            <li>✅ Viewport-based cell rendering</li>
            <li>✅ Scrollbar visualization and dragging</li>
            <li>✅ Panning and zooming support</li>
            <li>✅ Layer-based scroll event handling</li>
            <li>✅ Lazy loading simulation</li>
            <li>📋 Cell editing and selection</li>
            <li>📋 Filtering and sorting</li>
            <li>📋 Multiple tables in one canvas</li>
          </ul>
        </div>
      </div>

      <div class="demos-section">
        <h2>Demo Pages</h2>
        <div class="demo-cards">
          <div class="demo-card">
            <div class="demo-card-header">
              <h3>Normal Table Demo</h3>
              <span class="demo-status status-complete">Complete</span>
            </div>
            <p class="demo-description">
              Simple table rendering with Konva.js. Demonstrates basic table structure, cell rendering, interactive controls, and memory usage calculations for
              data storage and rendering.
            </p>
            <div class="demo-features">
              <span class="feature-tag">Table Structure</span>
              <span class="feature-tag">Cell Rendering</span>
              <span class="feature-tag">Basic Controls</span>
              <span class="feature-tag">Memory Stats</span>
            </div>
            <a href="/test-canvas-normal-table" class="demo-link">
              <span>Open Demo</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div class="demo-card">
            <div class="demo-card-header">
              <h3>Virtual Scrolling Demo</h3>
              <span class="demo-status status-in-progress">In Progress</span>
            </div>
            <p class="demo-description">
              Advanced virtual scrolling implementation. Shows performance with 10,000+ rows, viewport-based rendering, scrollbar interactions, and detailed
              memory calculations including data size, rendering memory, and performance metrics.
            </p>
            <div class="demo-features">
              <span class="feature-tag">Virtual Scrolling</span>
              <span class="feature-tag">10,000+ Rows</span>
              <span class="feature-tag">Scrollbars</span>
              <span class="feature-tag">Pan/Zoom</span>
              <span class="feature-tag">Memory Analysis</span>
              <span class="feature-tag">Performance Metrics</span>
            </div>
            <a href="/test-canvas-virtual-scroll" class="demo-link">
              <span>Open Demo</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div class="demo-card">
            <div class="demo-card-header">
              <h3>Coming Soon</h3>
              <span class="demo-status status-planned">Planned</span>
            </div>
            <p class="demo-description">Future demos including cell editing, filtering/sorting, fixed columns, and multiple table support.</p>
            <div class="demo-features">
              <span class="feature-tag">Cell Editing</span>
              <span class="feature-tag">Filtering</span>
              <span class="feature-tag">Fixed Columns</span>
              <span class="feature-tag">Multi-table</span>
            </div>
            <div class="demo-link disabled">
              <span>Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      <div class="documentation-section">
        <h2>Documentation</h2>
        <div class="doc-cards">
          <a href="/docs/konva-table-poc-requirements" class="doc-card">
            <div class="doc-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div class="doc-content">
              <h3>Requirements Document</h3>
              <p>Detailed requirements, acceptance criteria, and implementation plan for the POC.</p>
            </div>
          </a>

          <div class="doc-card">
            <div class="doc-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div class="doc-content">
              <h3>Task Tracking</h3>
              <p>Development tasks and progress tracking for the POC implementation.</p>
            </div>
          </div>

          <div class="doc-card">
            <div class="doc-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
            <div class="doc-content">
              <h3>Technical Documentation</h3>
              <p>API reference, architecture details, and performance guidelines.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="tech-stack">
        <h2>Technology Stack</h2>
        <div class="tech-items">
          <div class="tech-item">
            <div class="tech-icon">Vue</div>
            <span class="tech-name">Vue 3</span>
          </div>
          <div class="tech-item">
            <div class="tech-icon">TS</div>
            <span class="tech-name">TypeScript</span>
          </div>
          <div class="tech-item">
            <div class="tech-icon">K</div>
            <span class="tech-name">Konva.js</span>
          </div>
          <div class="tech-item">
            <div class="tech-icon">SCSS</div>
            <span class="tech-name">SCSS</span>
          </div>
          <div class="tech-item">
            <div class="tech-icon">Nuxt</div>
            <span class="tech-name">Nuxt 3</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Landing page for canvas renderer demos
</script>

<style scoped lang="scss">
.demo-index {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;

  h1 {
    font-size: 36px;
    margin: 0 0 12px 0;
    font-weight: 700;
  }

  .subtitle {
    font-size: 18px;
    opacity: 0.9;
    margin: 0;
    font-weight: 400;
  }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.overview {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.overview-card,
.features-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e1e8ed;

  h2 {
    color: #2c3e50;
    margin: 0 0 16px 0;
    font-size: 24px;
    font-weight: 600;
  }

  p {
    color: #5a6c7d;
    line-height: 1.6;
    margin: 0 0 24px 0;
  }
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  text-align: center;

  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e1e8ed;

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #3498db;
      font-family: 'Monaco', 'Consolas', monospace;
    }

    .stat-label {
      font-size: 12px;
      color: #7f8c8d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    padding: 8px 0;
    color: #5a6c7d;
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }
  }
}

.demos-section {
  h2 {
    color: #2c3e50;
    font-size: 28px;
    margin: 0 0 24px 0;
    font-weight: 600;
  }
}

.demo-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.demo-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e1e8ed;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.demo-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;

  h3 {
    color: #2c3e50;
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
}

.demo-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.status-complete {
    background: #d4edda;
    color: #155724;
  }

  &.status-in-progress {
    background: #fff3cd;
    color: #856404;
  }

  &.status-planned {
    background: #d1ecf1;
    color: #0c5460;
  }
}

.demo-description {
  color: #5a6c7d;
  line-height: 1.6;
  margin: 0 0 20px 0;
  flex-grow: 1;
}

.demo-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.feature-tag {
  padding: 4px 8px;
  background: #f8fafc;
  border: 1px solid #e1e8ed;
  border-radius: 6px;
  font-size: 12px;
  color: #5a6c7d;
  font-weight: 500;
}

.demo-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: background 0.2s;

  &:hover {
    background: #2980b9;
  }

  &.disabled {
    background: #95a5a6;
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.documentation-section {
  h2 {
    color: #2c3e50;
    font-size: 28px;
    margin: 0 0 24px 0;
    font-weight: 600;
  }
}

.doc-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.doc-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e1e8ed;
  display: flex;
  gap: 16px;
  text-decoration: none;
  color: inherit;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.doc-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 8px;
  color: #3498db;
}

.doc-content {
  flex-grow: 1;

  h3 {
    color: #2c3e50;
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
  }

  p {
    color: #5a6c7d;
    line-height: 1.6;
    margin: 0;
    font-size: 14px;
  }
}

.tech-stack {
  h2 {
    color: #2c3e50;
    font-size: 28px;
    margin: 0 0 24px 0;
    font-weight: 600;
  }
}

.tech-items {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.tech-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e1e8ed;
  min-width: 100px;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }
}

.tech-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  font-size: 20px;
  font-weight: 700;
  font-family: 'Monaco', 'Consolas', monospace;
}

.tech-name {
  color: #2c3e50;
  font-weight: 600;
  font-size: 14px;
}

// Responsive adjustments
@media (max-width: 768px) {
  .header {
    padding: 24px 16px;

    h1 {
      font-size: 28px;
    }

    .subtitle {
      font-size: 16px;
    }
  }

  .overview-card,
  .features-card,
  .demo-card,
  .doc-card {
    padding: 20px;
  }

  .stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .demo-index {
    padding: 16px;
  }

  .header {
    padding: 20px 12px;

    h1 {
      font-size: 24px;
    }

    .subtitle {
      font-size: 14px;
    }
  }

  .tech-items {
    justify-content: flex-start;
  }

  .tech-item {
    min-width: 80px;
    padding: 12px;
  }
}
</style>
