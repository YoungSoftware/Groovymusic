class Visualizer {
    constructor(audioElement, canvas) {
        this.audioElement = audioElement;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.source = this.audioContext.createMediaElementSource(this.audioElement);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.mode = 'bars'; // Default mode
        this.isActive = false;
    }

    start() {
        this.isActive = true;
        this.draw();
    }

    stop() {
        this.isActive = false;
    }

    setMode(mode) {
        this.mode = mode;
    }

    draw() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.analyser.getByteFrequencyData(this.dataArray);

        switch (this.mode) {
            case 'bars':
                this.drawBars();
                break;
            case 'wave':
                this.drawWave();
                break;
            case 'circular':
                this.drawCircular();
                break;
        }

        requestAnimationFrame(() => this.draw());
    }

    drawBars() {
        const barWidth = this.canvas.width / this.analyser.frequencyBinCount;
        let x = 0;

        for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
            const barHeight = this.dataArray[i] / 2;
            this.ctx.fillStyle = `hsl(${i / this.analyser.frequencyBinCount * 360}, 100%, 50%)`;
            this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
            x += barWidth;
        }
    }

    drawWave() {
        this.ctx.beginPath();
        const sliceWidth = this.canvas.width / this.analyser.frequencyBinCount;
        let x = 0;

        for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
            const v = this.dataArray[i] / 128.0;
            const y = v * this.canvas.height / 2;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.ctx.strokeStyle = 'rgb(0, 255, 0)';
        this.ctx.stroke();
    }

    drawCircular() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
            const barHeight = this.dataArray[i] / 2;
            const angle = (i / this.analyser.frequencyBinCount) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * (radius - barHeight);
            const y = centerY + Math.sin(angle) * (radius - barHeight);

            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(x, y);
            this.ctx.strokeStyle = `hsl(${i / this.analyser.frequencyBinCount * 360}, 100%, 50%)`;
            this.ctx.stroke();
        }
    }
}