// ============================================================
// Weather Effects Module
// Renders real-time weather particles on a canvas overlay
// based on the visitor's local weather conditions.
// Uses IP geolocation (ipapi.co) + Open-Meteo (no API keys).
// Caches weather data in localStorage for 30 minutes.
// ============================================================

(function () {
    'use strict';

    // --- Configuration ---
    const CONFIG = {
        ENABLED: false, // Set to true to enable weather effects
        CACHE_KEY: 'portfolio_weather_cache',
        CACHE_DURATION_MS: 30 * 60 * 1000, // 30 minutes
        GEO_URL: 'https://ipapi.co/json/',
        WEATHER_URL: 'https://api.open-meteo.com/v1/forecast',
        CANVAS_ID: 'weather-canvas',
    };

    // --- WMO Weather Code Mapping ---
    // Maps WMO code ranges to effect types
    function getEffectType(code) {
        if (code === 0) return 'clear';
        if (code >= 1 && code <= 3) return 'cloudy';
        if (code === 45 || code === 48) return 'fog';
        if (code >= 51 && code <= 57) return 'drizzle';
        if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
        if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snow';
        if (code >= 95 && code <= 99) return 'thunderstorm';
        return 'clear';
    }

    // ============================================================
    // WeatherService — Handles data fetching + caching
    // ============================================================
    class WeatherService {
        constructor() {
            this.data = null;
        }

        async getWeather() {
            // 1. Check cache first
            const cached = this._getCache();
            if (cached) {
                this.data = cached;
                return cached;
            }

            try {
                // 2. Get location from IP
                const geo = await this._fetchJSON(CONFIG.GEO_URL);
                if (!geo || !geo.latitude || !geo.longitude) {
                    throw new Error('Geolocation failed');
                }

                // 3. Get weather from Open-Meteo
                const weatherUrl = `${CONFIG.WEATHER_URL}?latitude=${geo.latitude}&longitude=${geo.longitude}&current=weather_code,is_day`;
                const weather = await this._fetchJSON(weatherUrl);

                if (!weather || !weather.current) {
                    throw new Error('Weather data unavailable');
                }

                const result = {
                    weather_code: weather.current.weather_code,
                    is_day: weather.current.is_day,
                    timestamp: Date.now(),
                };

                // 4. Cache it
                this._setCache(result);
                this.data = result;
                return result;
            } catch (err) {
                console.warn('[Weather] Could not fetch weather data:', err.message);
                return null;
            }
        }

        _getCache() {
            try {
                const raw = localStorage.getItem(CONFIG.CACHE_KEY);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                if (Date.now() - parsed.timestamp < CONFIG.CACHE_DURATION_MS) {
                    return parsed;
                }
                localStorage.removeItem(CONFIG.CACHE_KEY);
                return null;
            } catch {
                return null;
            }
        }

        _setCache(data) {
            try {
                localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(data));
            } catch {
                // localStorage full or unavailable — silently fail
            }
        }

        async _fetchJSON(url) {
            const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        }
    }

    // ============================================================
    // Particle base class
    // ============================================================
    class Particle {
        constructor(canvas) {
            this.canvas = canvas;
            this.reset(true);
        }

        reset(initialSpawn = false) {
            this.x = Math.random() * this.canvas.width;
            this.y = initialSpawn
                ? Math.random() * this.canvas.height
                : -10;
        }

        update() { }
        draw(ctx) { }
    }

    // ============================================================
    // Rain Particle
    // ============================================================
    class RainDrop extends Particle {
        reset(initialSpawn = false) {
            super.reset(initialSpawn);
            // Offset x to the right so angled drops start from beyond left edge
            this.x = Math.random() * (this.canvas.width + 200) - 100;
            this.length = 15 + Math.random() * 20;
            this.speed = 12 + Math.random() * 10;
            this.opacity = 0.15 + Math.random() * 0.25;
            this.wind = 2 + Math.random() * 2; // slight angle
        }

        update() {
            this.y += this.speed;
            this.x += this.wind;
            if (this.y > this.canvas.height + 10) {
                this.reset(false);
            }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.wind * 1.5, this.y + this.length);
            ctx.strokeStyle = `rgba(174, 194, 224, ${this.opacity})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
    }

    // ============================================================
    // Drizzle Particle — thinner, slower, shorter
    // ============================================================
    class DrizzleDrop extends Particle {
        reset(initialSpawn = false) {
            super.reset(initialSpawn);
            this.length = 6 + Math.random() * 8;
            this.speed = 5 + Math.random() * 5;
            this.opacity = 0.1 + Math.random() * 0.15;
            this.wind = 0.5 + Math.random() * 1;
        }

        update() {
            this.y += this.speed;
            this.x += this.wind;
            if (this.y > this.canvas.height + 5) {
                this.reset(false);
            }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.wind, this.y + this.length);
            ctx.strokeStyle = `rgba(174, 194, 224, ${this.opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }
    }

    // ============================================================
    // Snowflake Particle
    // ============================================================
    class Snowflake extends Particle {
        reset(initialSpawn = false) {
            super.reset(initialSpawn);
            this.radius = 1.5 + Math.random() * 3;
            this.speed = 0.8 + Math.random() * 1.5;
            this.opacity = 0.3 + Math.random() * 0.5;
            this.sway = Math.random() * Math.PI * 2; // phase offset
            this.swaySpeed = 0.01 + Math.random() * 0.02;
            this.swayAmplitude = 0.4 + Math.random() * 0.8;
        }

        update() {
            this.y += this.speed;
            this.sway += this.swaySpeed;
            this.x += Math.sin(this.sway) * this.swayAmplitude;
            if (this.y > this.canvas.height + 10) {
                this.reset(false);
            }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.fill();
        }
    }

    // ============================================================
    // WeatherRenderer — Manages canvas + particle system
    // ============================================================
    class WeatherRenderer {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.particles = [];
            this.effectType = 'clear';
            this.isDay = true;
            this.animationId = null;
            this.fogPhase = 0;
            this.thunderTimer = 0;
            this.flashOpacity = 0;
            this.lastTime = 0;

            this._resize();
            window.addEventListener('resize', () => this._resize());
        }

        _resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        setWeather(weatherCode, isDay) {
            this.effectType = getEffectType(weatherCode);
            this.isDay = isDay === 1;
            this.particles = [];
            this.fogPhase = 0;
            this.thunderTimer = 0;
            this.flashOpacity = 0;

            // Create particles based on effect type
            switch (this.effectType) {
                case 'rain':
                    for (let i = 0; i < 200; i++) {
                        this.particles.push(new RainDrop(this.canvas));
                    }
                    break;

                case 'drizzle':
                    for (let i = 0; i < 80; i++) {
                        this.particles.push(new DrizzleDrop(this.canvas));
                    }
                    break;

                case 'snow':
                    for (let i = 0; i < 120; i++) {
                        this.particles.push(new Snowflake(this.canvas));
                    }
                    break;

                case 'thunderstorm':
                    for (let i = 0; i < 250; i++) {
                        this.particles.push(new RainDrop(this.canvas));
                    }
                    // Schedule first thunder flash
                    this.thunderTimer = 3 + Math.random() * 5;
                    break;

                case 'fog':
                case 'cloudy':
                case 'clear':
                default:
                    // fog/cloudy use gradient overlays, no particles
                    // clear = no effect at all
                    break;
            }
        }

        start() {
            if (this.effectType === 'clear') {
                // Nothing to render for clear weather
                this.canvas.style.display = 'none';
                return;
            }
            this.canvas.style.display = 'block';
            this.lastTime = performance.now();
            this._animate();
        }

        stop() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }

        _animate() {
            const now = performance.now();
            const dt = (now - this.lastTime) / 1000; // delta in seconds
            this.lastTime = now;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Night tint overlay
            if (!this.isDay) {
                this.ctx.fillStyle = 'rgba(10, 15, 30, 0.08)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            // Effect-specific rendering
            switch (this.effectType) {
                case 'fog':
                    this._renderFog(dt, 0.12);
                    break;
                case 'cloudy':
                    this._renderFog(dt, 0.04);
                    break;
                case 'thunderstorm':
                    this._renderThunder(dt);
                    // fall through to render rain particles
                    this._renderParticles();
                    break;
                default:
                    this._renderParticles();
                    break;
            }

            this.animationId = requestAnimationFrame(() => this._animate());
        }

        _renderParticles() {
            for (const p of this.particles) {
                p.update();
                p.draw(this.ctx);
            }
        }

        _renderFog(dt, maxOpacity) {
            this.fogPhase += dt * 0.3;
            // Pulsing fog overlay
            const opacity = maxOpacity * (0.7 + 0.3 * Math.sin(this.fogPhase));
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, `rgba(180, 190, 210, ${opacity * 0.5})`);
            gradient.addColorStop(0.4, `rgba(160, 170, 190, ${opacity})`);
            gradient.addColorStop(0.7, `rgba(140, 155, 175, ${opacity * 0.8})`);
            gradient.addColorStop(1, `rgba(120, 135, 160, ${opacity * 0.3})`);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        _renderThunder(dt) {
            // Thunder flash timer
            this.thunderTimer -= dt;
            if (this.thunderTimer <= 0) {
                // Trigger a flash
                this.flashOpacity = 0.25 + Math.random() * 0.15;
                // Next flash in 5-15 seconds
                this.thunderTimer = 5 + Math.random() * 10;
            }

            // Render and decay flash
            if (this.flashOpacity > 0) {
                this.ctx.fillStyle = `rgba(200, 210, 255, ${this.flashOpacity})`;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.flashOpacity *= 0.88; // rapid decay
                if (this.flashOpacity < 0.005) this.flashOpacity = 0;
            }
        }
    }

    // ============================================================
    // Initialization
    // ============================================================
    async function init() {
        // Kill switch
        if (!CONFIG.ENABLED) return;

        // Respect reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const canvas = document.getElementById(CONFIG.CANVAS_ID);
        if (!canvas) {
            console.warn('[Weather] Canvas element not found');
            return;
        }

        const service = new WeatherService();
        const renderer = new WeatherRenderer(canvas);

        const data = await service.getWeather();
        if (!data) {
            canvas.style.display = 'none';
            return;
        }

        renderer.setWeather(data.weather_code, data.is_day);
        renderer.start();

        // Expose a debug helper on window for testing effects
        window.__weatherDebug = {
            setEffect: (code, isDay = 1) => {
                renderer.stop();
                renderer.setWeather(code, isDay);
                renderer.start();
            },
            codes: {
                clear: 0,
                cloudy: 2,
                fog: 45,
                drizzle: 53,
                rain: 63,
                heavyRain: 65,
                snow: 73,
                thunderstorm: 95,
            },
            clearCache: () => localStorage.removeItem(CONFIG.CACHE_KEY),
        };
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
