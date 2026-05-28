// Prep DOM text lines for GSAP animation: wrap each .split-target with
// <span.line-wrapper><span.line-inner>...</span></span> so .line-inner can be translated.
export function wrapSplitTargets() {
  document.querySelectorAll('.split-target').forEach((el) => {
    if (el.querySelector('.line-wrapper')) return;
    const wrapper = document.createElement('span');
    wrapper.className = 'line-wrapper';
    const inner = document.createElement('span');
    inner.className = 'line-inner';
    while (el.firstChild) inner.appendChild(el.firstChild);
    wrapper.appendChild(inner);
    el.appendChild(wrapper);
  });
}
