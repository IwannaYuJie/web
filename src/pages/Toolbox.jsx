import React from 'react';
import { Link } from 'react-router-dom';

function Toolbox() {
  const tools = [
    {
      id: 'sprite-sheet-to-gif',
      title: '🎞️ 精灵图转 GIF',
      description: '将包含多个帧的精灵图(Sprite Sheet)分割并转换为 GIF 动图。支持自定义行列和帧率。',
      icon: '🐱',
      path: '/toolbox/sprite-sheet-to-gif',
      isNew: true
    },
    // 未来可以在这里添加更多工具
    // {
    //   id: 'color-palette',
    //   title: '🎨 配色提取器',
    //   description: '从图片中提取主要配色方案。',
    //   icon: '🎨',
    //   path: '/toolbox/color-palette'
    // }
  ];

  return (
    <div className="container fade-in">
      <header className="page-header">
        <h1>🧰 橘猫工具箱</h1>
        <p>这里有一些实用的小工具，希望能帮到你喵！</p>
      </header>

      <div className="tools-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '2rem',
        marginTop: '2rem'
      }}>
        {tools.map(tool => (
          <Link to={tool.path} key={tool.id} style={{ textDecoration: 'none' }}>
            <div className="card tool-card" style={{ height: '100%', position: 'relative' }}>
              {tool.isNew && (
                <span style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: 'var(--primary-color)',
                  color: 'white',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  boxShadow: 'var(--shadow)'
                }}>
                  NEW!
                </span>
              )}
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{tool.icon}</div>
              <h3 style={{ color: 'var(--text-color)', marginBottom: '0.5rem' }}>{tool.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Toolbox;
