import React from 'react';

const styles = {
  wrap: { maxWidth: '1100px', margin: '0 auto 1.9rem' },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' },
  title: { fontSize: '1.15rem', fontWeight: 800, color: 'white', letterSpacing: '0.3px' },
  scroller: { display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.6rem' },
  item: { width: '168px', flexShrink: 0 },
};

export default function Rail({ title, action, children }) {
  const items = React.Children.toArray(children);
  if (items.length === 0) return null;
  return (
    <div style={styles.wrap}>
      <div style={styles.head}>
        <div style={styles.title}>{title}</div>
        {action}
      </div>
      <div style={styles.scroller} className="lw-hscroll">
        {items.map((child, i) => <div key={i} style={styles.item}>{child}</div>)}
      </div>
    </div>
  );
}
