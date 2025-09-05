// Menu Board JavaScript Functionality
class MenuBoard {
    constructor() {
        this.editMode = false;
        this.panelColors = ['green-panel', 'blue-panel', 'yellow-panel', 'pink-panel', 'beige-panel', 'white-panel', 'brown-panel', 'gray-panel'];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSavedMenu();
        this.setupAutoSave();
    }

    setupEventListeners() {
        // Save on content changes
        document.addEventListener('input', (e) => {
            if (e.target.contentEditable === 'true') {
                this.saveMenu();
            }
        });

        // Handle Enter key in contenteditable elements
        document.addEventListener('keydown', (e) => {
            if (e.target.contentEditable === 'true' && e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
            }
        });
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
        const body = document.body;
        
        if (this.editMode) {
            body.classList.add('edit-mode');
            this.showNotification('Edit mode enabled - Click on any text to edit', 'success');
        } else {
            body.classList.remove('edit-mode');
            this.showNotification('Edit mode disabled', 'info');
        }
    }

    addPanel() {
        // Find the right column to add to
        const rightColumn = document.querySelector('.right-column');
        const randomColor = this.panelColors[Math.floor(Math.random() * this.panelColors.length)];
        
        const newPanel = this.createPanel('NEW ITEM', '$0.00', randomColor, '🍔');
        
        rightColumn.appendChild(newPanel);
        newPanel.classList.add('new-panel');
        
        // Focus on the title for immediate editing
        const panelTitle = newPanel.querySelector('.panel-title');
        panelTitle.focus();
        panelTitle.select();
        
        this.saveMenu();
        this.showNotification('New panel added', 'success');
    }

    createPanel(title, price, colorClass, emoji) {
        const panel = document.createElement('div');
        panel.className = `menu-panel ${colorClass}`;
        panel.innerHTML = `
            <div class="panel-image">
                <div class="food-placeholder">${emoji}</div>
            </div>
            <div class="panel-content">
                <h3 class="panel-title" contenteditable="true">${title}</h3>
                <div class="panel-price" contenteditable="true">${price}</div>
            </div>
            <button class="delete-panel" onclick="deletePanel(this)">×</button>
        `;
        return panel;
    }

    deletePanel(button) {
        if (confirm('Are you sure you want to delete this panel?')) {
            const panel = button.closest('.menu-panel') || button.closest('.featured-panel');
            panel.style.animation = 'slideOut 0.3s ease-in';
            
            setTimeout(() => {
                panel.remove();
                this.saveMenu();
                this.showNotification('Panel deleted', 'info');
            }, 300);
        }
    }

    exportMenu() {
        const menuData = this.getMenuData();
        const dataStr = JSON.stringify(menuData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'menu-board.json';
        link.click();
        
        this.showNotification('Menu exported successfully', 'success');
    }

    importMenu() {
        document.getElementById('fileInput').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const menuData = JSON.parse(e.target.result);
                this.loadMenuData(menuData);
                this.showNotification('Menu imported successfully', 'success');
            } catch (error) {
                this.showNotification('Error importing menu: Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    getMenuData() {
        const data = {
            restaurantName: document.querySelector('.restaurant-name').textContent,
            subtitle: document.querySelector('.header-subtitle span').textContent,
            panels: []
        };

        // Get all panels
        document.querySelectorAll('.menu-panel, .featured-panel').forEach(panel => {
            const title = panel.querySelector('.panel-title')?.textContent || '';
            const price = panel.querySelector('.panel-price, .featured-price')?.textContent || '';
            const emoji = panel.querySelector('.food-placeholder')?.textContent || '🍔';
            const colorClass = Array.from(panel.classList).find(cls => cls.includes('-panel')) || 'gray-panel';
            const isFeatured = panel.classList.contains('featured-panel');

            data.panels.push({
                title,
                price,
                emoji,
                colorClass,
                isFeatured
            });
        });

        return data;
    }

    loadMenuData(data) {
        // Update header
        if (data.restaurantName) {
            document.querySelector('.restaurant-name').textContent = data.restaurantName;
        }
        if (data.subtitle) {
            document.querySelector('.header-subtitle span').textContent = data.subtitle;
        }

        // Clear existing panels (except featured)
        document.querySelectorAll('.menu-panel').forEach(panel => panel.remove());

        // Add panels
        const leftColumn = document.querySelector('.left-column');
        const rightColumn = document.querySelector('.right-column');
        
        if (data.panels) {
            data.panels.forEach((panelData, index) => {
                if (panelData.isFeatured) {
                    // Update featured panel
                    const featuredPanel = document.querySelector('.featured-panel');
                    if (featuredPanel) {
                        const priceEl = featuredPanel.querySelector('.featured-price');
                        const emojiEl = featuredPanel.querySelector('.food-placeholder');
                        if (priceEl) priceEl.textContent = panelData.price;
                        if (emojiEl) emojiEl.textContent = panelData.emoji;
                    }
                } else {
                    const panel = this.createPanel(
                        panelData.title,
                        panelData.price,
                        panelData.colorClass,
                        panelData.emoji
                    );
                    
                    // Add to appropriate column
                    if (index % 2 === 0) {
                        leftColumn.appendChild(panel);
                    } else {
                        rightColumn.appendChild(panel);
                    }
                }
            });
        }
    }

    saveMenu() {
        const menuData = this.getMenuData();
        localStorage.setItem('menuBoardData', JSON.stringify(menuData));
    }

    loadSavedMenu() {
        const savedData = localStorage.getItem('menuBoardData');
        if (savedData) {
            try {
                const menuData = JSON.parse(savedData);
                this.loadMenuData(menuData);
            } catch (error) {
                console.error('Error loading saved menu:', error);
            }
        }
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveMenu();
        }, 30000);
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                this.showNotification('Fullscreen mode enabled - Perfect for TV display!', 'success');
            }).catch(() => {
                this.showNotification('Fullscreen not supported on this browser', 'warning');
            });
        } else {
            document.exitFullscreen().then(() => {
                this.showNotification('Fullscreen mode disabled', 'info');
            });
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '700',
            fontSize: '1rem',
            zIndex: '1000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            fontFamily: 'Oswald, sans-serif'
        });

        // Set background color based on type
        const colors = {
            success: 'linear-gradient(135deg, #4caf50, #45a049)',
            error: 'linear-gradient(135deg, #f44336, #d32f2f)',
            info: 'linear-gradient(135deg, #2196f3, #1976d2)',
            warning: 'linear-gradient(135deg, #ff9800, #f57c00)'
        };
        notification.style.background = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
function toggleEditMode() {
    menuBoard.toggleEditMode();
}

function addPanel() {
    menuBoard.addPanel();
}

function deletePanel(button) {
    menuBoard.deletePanel(button);
}

function exportMenu() {
    menuBoard.exportMenu();
}

function importMenu() {
    menuBoard.importMenu();
}

function handleFileImport(event) {
    menuBoard.handleFileImport(event);
}

function toggleFullscreen() {
    menuBoard.toggleFullscreen();
}

// Add slideOut animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// Initialize the menu board when DOM is loaded
let menuBoard;
document.addEventListener('DOMContentLoaded', () => {
    menuBoard = new MenuBoard();
    
    // Show welcome message
    setTimeout(() => {
        menuBoard.showNotification('Welcome! Use controls to customize your menu board', 'info');
    }, 1000);
});

// Handle page unload to save menu
window.addEventListener('beforeunload', () => {
    if (menuBoard) {
        menuBoard.saveMenu();
    }
});