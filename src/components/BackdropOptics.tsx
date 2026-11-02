/** Shared SVG backdrop filters. Floating UI uses a smooth procedural field
 * because an feImage(data:) normal map silently resolved to black in the
 * Chromium backdrop-filter path, causing a flat shift rather than refraction.
 * No extra WebGL context, shader compilation, network fetch or DOM capture. */
const rectangleMap = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAABACAYAAABMbHjfAAAA60lEQVR42u3YsQqDQBBF0WeyGsFOsEi+Nn9umg1sIClTzTmwldoMc0Gd7o/nOSW5Jmn9zEmWJLcvZx2uLf3euT936Qf+5b1jbdi9cR/XH3u7DHva+r5PSVo2Q6Wult0QqBzAYQgIALwCQb0AfARTOgD/LSnM+iMAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAACAAEAAIAAQAAgABgABAAPChSYDaAWyGQOUAdkOgcgCHISAA8AoEPoKhkBd0GgPoO0wMJgAAAABJRU5ErkJggg==";
const capsuleMap = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAABACAYAAADS1n9/AAAA+0lEQVR42u3dQQrCMBRF0d82UdEVdLfuXCcJhI4cCu9cKJYqDn7OpArpdp7vz1ZV+ziOcbSq6uP1Ns77OL8t19b35ufncYzv3Mah35sz25f1aMu69Mv8r+syr63reCxrMtelVTPs5Fp1Q8gG8DCEbABPQ8gG8DIEAASAABAAchuoMAB3Q8gG4JfAcAD+pYluNwIABIAAEAACQAAIAAEgAASAABAAAkAACAABIAAEgAAQAAJAAAgAASAABIAAEAACQAAIAAEgAASAABAA+r/sEhYPwD6B4QDsFBoOwF7B4QDsFg6AABAAAkCBADw30G2gkgH4JTAcgKeHR/cFkm8EAazb5toAAAAASUVORK5CYII=";

// These two maps are exclusively for the floating UI. The buttons, header,
// and Curiosity panel retain their V8 optical treatment unchanged. Each map
// has a smooth, continuous center-to-edge normal profile (no diagonal seams).

export function BackdropOptics() {
  return (
    <svg className="backdrop-optics-definitions" aria-hidden="true" width="0" height="0" focusable="false">
      <defs>
        <filter id="glass-backdrop-rect" x="-3%" y="-6%" width="106%" height="112%" colorInterpolationFilters="sRGB">
          <feImage href={rectangleMap} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="optic-displacement" />
          <feDisplacementMap in="SourceGraphic" in2="optic-displacement" scale="12" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="glass-backdrop-capsule" x="-4%" y="-8%" width="108%" height="116%" colorInterpolationFilters="sRGB">
          <feImage href={capsuleMap} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="optic-displacement" />
          <feDisplacementMap in="SourceGraphic" in2="optic-displacement" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* V11: real backdrop displacement for floating UI. The previous
            feImage(data:) normal maps were evaluated as black in Chromium's
            backdrop-filter path, causing a constant x/y translation instead
            of any actual bending. Use an in-filter procedural normal field:
            1 octave + Gaussian smoothing, with no overlay noise texture.
            The field displaces SourceGraphic (the DOM backdrop), not labels. */}
        <filter id="glass-ambient-panel" x="-8%" y="-12%" width="116%" height="124%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.003 0.006" numOctaves="1" seed="4" result="panel-field" />
          <feGaussianBlur in="panel-field" stdDeviation="5" result="panel-normal" />
          <feDisplacementMap in="SourceGraphic" in2="panel-normal" scale="42" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="glass-ambient-pill" x="-12%" y="-22%" width="124%" height="144%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.009" numOctaves="1" seed="4" result="pill-field" />
          <feGaussianBlur in="pill-field" stdDeviation="6" result="pill-normal" />
          <feDisplacementMap in="SourceGraphic" in2="pill-normal" scale="66" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="glass-mail-modal" x="-8%" y="-10%" width="116%" height="120%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="1" seed="8" result="modal-field" />
          <feGaussianBlur in="modal-field" stdDeviation="4" result="modal-normal" />
          <feDisplacementMap in="SourceGraphic" in2="modal-normal" scale="11" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="page-bloom" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="bloom-blur" />
          <feComponentTransfer in="bloom-blur" result="bloom-highlights">
            <feFuncR type="linear" slope="1.35" intercept="-0.38" />
            <feFuncG type="linear" slope="1.35" intercept="-0.38" />
            <feFuncB type="linear" slope="1.35" intercept="-0.38" />
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" in2="bloom-highlights" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}
