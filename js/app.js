/**
 * Mind Castle - Main Application JavaScript
 * Handles app functionality, voice recording, and storage
 */

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Show splash screen for 1.5 seconds
    setTimeout(() => {
        const splashScreen = document.getElementById('splashScreen');
        if (splashScreen) {
            splashScreen.classList.add('hidden');
            // Remove from DOM after animation completes
            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 500);
        }
    }, 1500);

    // Initialize app
    const app = new MindCastleApp();
    app.initialize();
});

class MindCastleApp {
    constructor() {
        // DOM Elements - Main UI
        this.recordButton = document.getElementById('recordButton');
        this.stopRecordingButton = document.getElementById('stopRecordingButton');
        this.recordingStatus = document.getElementById('recordingStatus');
        this.recordingModal = document.getElementById('recordingModal');
        this.thoughtPreview = document.getElementById('thoughtPreview');
        this.thoughtTitleInput = document.getElementById('thoughtTitleInput');
        this.thoughtCategorySelect = document.getElementById('thoughtCategorySelect');
        this.saveThoughtButton = document.getElementById('saveThoughtButton');
        this.discardThoughtButton = document.getElementById('discardThoughtButton');
        this.roomCards = document.querySelectorAll('.room-card:not(.add-room-card)');
        this.addRoomCard = document.getElementById('addRoomCard');
        this.backToRoomsButton = document.getElementById('backToRooms');
        this.currentRoomTitle = document.getElementById('currentRoomTitle');
        this.thoughtsList = document.getElementById('thoughtsList');
        this.thoughtsView = document.getElementById('thoughtsView');
        this.searchInput = document.getElementById('searchInput');
        this.searchButton = document.getElementById('searchButton');

        // DOM Elements - Thought Modal
        this.thoughtModal = document.getElementById('thoughtModal');
        this.closeModalButton = document.querySelector('.thought-modal .close-button');
        this.thoughtTitle = document.getElementById('thoughtTitle');
        this.thoughtDate = document.getElementById('thoughtDate');
        this.thoughtRoom = document.getElementById('thoughtRoom');
        this.thoughtContent = document.getElementById('thoughtContent');
        this.aiActionContainer = document.getElementById('aiActionContainer');
        this.aiActionButton = document.getElementById('aiActionButton');
        this.aiActionText = document.getElementById('aiActionText');
        this.aiUsageCounter = document.getElementById('aiUsageCounter');
        this.editThoughtButton = document.getElementById('editThoughtButton');
        this.deleteThoughtButton = document.getElementById('deleteThoughtButton');

        // DOM Elements - Premium Modal
        this.premiumModal = document.getElementById('premium-modal');
        this.closePremiumModal = document.querySelector('#premium-modal .close');
        this.upgradeButton = document.getElementById('upgrade-btn');

        // DOM Elements - Remind Me Feature (Mind Echo)
        this.remindMeButton = document.getElementById('remindMeButton');
        this.randomMemoryModal = document.getElementById('randomMemoryModal');
        this.closeRandomMemory = document.getElementById('closeRandomMemory');
        this.randomMemoryTitle = document.getElementById('randomMemoryTitle');
        this.randomMemoryContent = document.getElementById('randomMemoryContent');
        this.randomMemoryDate = document.getElementById('randomMemoryDate');
        this.randomMemoryRoom = document.getElementById('randomMemoryRoom');
        this.viewFullMemoryButton = document.getElementById('viewFullMemoryButton');
        
        // DOM Elements - Create Room Modal
        this.createRoomModal = document.getElementById('createRoomModal');
        this.closeCreateRoomModal = document.getElementById('closeCreateRoomModal');
        this.roomNameInput = document.getElementById('roomNameInput');
        this.roomColorPicker = document.getElementById('roomColorPicker');
        this.colorOptions = document.querySelectorAll('.color-option');
        this.selectedRoomColor = document.getElementById('selectedRoomColor');
        this.saveRoomButton = document.getElementById('saveRoomButton');
        this.cancelRoomButton = document.getElementById('cancelRoomButton');

        // DOM Elements - PWA & Status
        this.installButton = document.getElementById('installApp');
        this.offlineNotification = document.getElementById('offlineNotification');
        
        // Stats elements
        this.totalThoughtsElement = document.getElementById('totalThoughts');
        this.frequentRoomElement = document.getElementById('frequentRoom');
        this.dailyStreakElement = document.getElementById('dailyStreak');
        this.roomCountElements = {
            'personal-growth': document.getElementById('personalGrowthCount'),
            'business-ideas': document.getElementById('businessIdeasCount'),
            'dreams-visions': document.getElementById('dreamsVisionsCount'),
            'relationships': document.getElementById('relationshipsCount'),
            'creativity': document.getElementById('creativityCount'),
            total: document.getElementById('totalThoughts')
        };
        
        // Speech recognition
        this.recognition = null;
        this.isRecording = false;
        this.transcript = '';
        
        // PWA installation prompt
        this.deferredPrompt = null;
        
        // Current view state
        this.currentRoom = null;
        this.currentThought = null;
        this.currentRandomMemory = null;
        
        // Room system
        this.defaultRooms = [
            'personal-growth',
            'business-ideas', 
            'dreams-visions', 
            'relationships', 
            'creativity'
        ];
        this.customRooms = [];
        
        // Premium features
        this.isPremium = false;
        this.aiDailyUsageCount = 0;
        this.aiDailyUsageLimit = 3;
        this.lastMindEchoDate = null;
        this.mindEchoInterval = 3; // days for free users
        this.mindEchoCandidates = [];
        
        // Initialize data storage
        this.storage = new MindCastleStorage();
    }
    
    initialize() {
        // Load custom rooms
        this.loadCustomRooms();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize Web Speech API if available
        this.initializeSpeechRecognition();
        
        // Load and display user data
        this.loadData();
        
        // Check premium status
        this.checkPremiumStatus();
        
        // Load AI usage data
        this.loadAIUsageData();
        
        // Check for Mind Echo (memory reminder) eligibility
        this.checkMindEchoEligibility();
        
        // Check online status
        this.checkOnlineStatus();
        
        // Set up PWA installation
        this.setupPWAInstall();
    }
    
    loadCustomRooms() {
        // Load custom rooms from storage
        const customRooms = this.storage.getCustomRooms();
        this.customRooms = customRooms;
        
        // Add custom rooms to the category select dropdown
        this.updateRoomSelectOptions();
    }
    
    updateRoomSelectOptions() {
        // Clear existing custom room options
        const existingOptions = this.thoughtCategorySelect.querySelectorAll('option:not([value^="personal"]):not([value^="business"]):not([value^="dreams"]):not([value^="relationships"]):not([value^="creativity"])');
        existingOptions.forEach(option => option.remove());
        
        // Add custom rooms to select
        this.customRooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = room.name;
            this.thoughtCategorySelect.appendChild(option);
        });
    }
    
    setupEventListeners() {
        // Record button
        this.recordButton.addEventListener('click', () => this.startRecording());
        
        // Stop recording button
        this.stopRecordingButton.addEventListener('click', () => this.stopRecording());
        
        // Save thought button
        this.saveThoughtButton.addEventListener('click', () => this.saveThought());
        
        // Discard thought button
        this.discardThoughtButton.addEventListener('click', () => this.discardThought());
        
        // Room card clicks
        this.roomCards.forEach(card => {
            card.addEventListener('click', () => {
                const room = card.getAttribute('data-room');
                this.openRoom(room);
            });
        });
        
        // Add new room card click
        this.addRoomCard.addEventListener('click', () => this.showCreateRoomModal());
        
        // Back to rooms button
        this.backToRoomsButton.addEventListener('click', () => this.closeRoom());
        
        // Search
        this.searchButton.addEventListener('click', () => this.searchThoughts());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchThoughts();
            }
        });
        
        // Thought Modal
        this.closeModalButton.addEventListener('click', () => this.closeThoughtModal());
        this.aiActionButton.addEventListener('click', () => this.handleAIAction());
        this.editThoughtButton.addEventListener('click', () => this.editThought());
        this.deleteThoughtButton.addEventListener('click', () => this.deleteCurrentThought());
        
        // Premium Modal
        this.closePremiumModal.addEventListener('click', () => this.closePremiumModal());
        this.upgradeButton.addEventListener('click', () => this.handleUpgrade());
        
        // Remind Me Feature
        this.remindMeButton.addEventListener('click', () => this.showRandomMemory());
        this.closeRandomMemory.addEventListener('click', () => this.closeRandomMemoryModal());
        this.viewFullMemoryButton.addEventListener('click', () => this.viewFullRandomMemory());
        
        // Create Room Modal
        this.closeCreateRoomModal.addEventListener('click', () => this.closeCreateRoomModal());
        this.saveRoomButton.addEventListener('click', () => this.createCustomRoom());
        this.cancelRoomButton.addEventListener('click', () => this.closeCreateRoomModal());
        
        // Color picker
        this.colorOptions.forEach(option => {
            option.addEventListener('click', () => this.selectRoomColor(option));
        });
        
        // Install app button
        this.installButton.addEventListener('click', () => this.installApp());
        
        // Network status changes
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));

        // Handle premium feature button clicks
        document.addEventListener('click', function(e) {
            if (e.target.matches('.glow-button') || e.target.closest('.glow-button')) {
                const buttonType = e.target.getAttribute('data-feature') || 
                                   e.target.closest('.glow-button').getAttribute('data-feature');
                
                if (buttonType === 'business-analysis') {
                    handleBusinessAnalysis();
                }
            }
        });
    }
    
    initializeSpeechRecognition() {
        // Check if Web Speech API is supported
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.log('Speech recognition not supported');
            
            // Modify UI to indicate speech recognition is not available
            this.recordButton.classList.add('disabled');
            this.recordButton.setAttribute('disabled', 'disabled');
            this.recordButton.querySelector('.button-text').textContent = 'Not Supported';
            
            return;
        }
        
        // Create speech recognition instance
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US'; // Default to English
        
        // Setup recognition event handlers
        this.recognition.onresult = (event) => {
            // Get the latest result
            const result = event.results[event.results.length - 1];
            
            // Check if the result is final
            if (result.isFinal) {
                this.transcript += result[0].transcript + ' ';
                
                // Update the preview if recording modal is visible
                if (!this.recordingModal.classList.contains('hidden')) {
                    this.thoughtPreview.textContent = this.transcript;
                }
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            this.stopRecording();
        };
        
        this.recognition.onend = () => {
            // Only stop if we're not manually stopping
            if (this.isRecording) {
                this.isRecording = false;
                this.recordingStatus.classList.add('hidden');
                this.showRecordingModal();
            }
        };
    }
    
    startRecording() {
        if (!this.recognition) return;
        
        // Reset transcript
        this.transcript = '';
        this.isRecording = true;
        
        // Show recording status
        this.recordingStatus.classList.remove('hidden');
        
        // Start recognition
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.isRecording = false;
            this.recordingStatus.classList.add('hidden');
        }
    }
    
    stopRecording() {
        if (!this.recognition || !this.isRecording) return;
        
        // Stop recognition
        this.isRecording = false;
        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Error stopping speech recognition:', error);
        }
        
        // Hide recording status
        this.recordingStatus.classList.add('hidden');
        
        // Show recording modal with transcript
        this.showRecordingModal();
    }
    
    showRecordingModal() {
        // If no transcript was captured, don't show the modal
        if (!this.transcript.trim()) {
            return;
        }
        
        // Update the preview
        this.thoughtPreview.textContent = this.transcript;
        
        // Generate a title suggestion based on the content
        const suggestedTitle = this.generateTitle(this.transcript);
        this.thoughtTitleInput.value = suggestedTitle;
        
        // Generate a category suggestion
        const suggestedCategory = this.categorizeThought(this.transcript);
        this.thoughtCategorySelect.value = suggestedCategory;
        
        // Show the modal
        this.recordingModal.classList.remove('hidden');
    }
    
    saveThought() {
        // Get form values
        const title = this.thoughtTitleInput.value.trim() || 'Untitled Thought';
        const category = this.thoughtCategorySelect.value;
        const content = this.transcript.trim();
        
        if (!content) {
            alert('Please record a thought before saving.');
            return;
        }
        
        // Create thought object
        const thought = {
            id: Date.now().toString(),
            title: title,
            content: content,
            category: category,
            date: new Date().toISOString(),
            isEchoCandiate: this.analyzeForMindEcho(content)
        };
        
        // Save thought
        this.storage.saveThought(thought);
        
        // Update UI
        this.updateStats();
        
        // If room is currently open, add the thought to the list
        if (this.currentRoom === category) {
            const thoughtCard = this.createThoughtCard(thought);
            this.thoughtsList.prepend(thoughtCard);
        }
        
        // Close modal
        this.recordingModal.classList.add('hidden');
        
        // Reset recording state
        this.transcript = '';
    }
    
    analyzeForMindEcho(content) {
        // Simple heuristic for emotional or action-oriented content
        // In a real app, this could use AI analysis
        const text = content.toLowerCase();
        const emotionalKeywords = ['feel', 'happy', 'sad', 'excited', 'worry', 'anxious', 'hope', 'dream', 'love', 'miss'];
        const actionKeywords = ['plan', 'goal', 'achieve', 'start', 'finish', 'build', 'create', 'launch', 'learn'];
        
        const hasEmotionalContent = emotionalKeywords.some(keyword => text.includes(keyword));
        const hasActionContent = actionKeywords.some(keyword => text.includes(keyword));
        
        return hasEmotionalContent || hasActionContent;
    }
    
    discardThought() {
        // Hide modal
        this.recordingModal.classList.add('hidden');
        
        // Reset transcript
        this.transcript = '';
    }
    
    loadData() {
        // Get all thoughts
        const thoughts = this.storage.getAllThoughts();
        
        // Update stats
        this.updateStats();
        
        // If a room is currently open, refresh its thoughts
        if (this.currentRoom) {
            this.openRoom(this.currentRoom);
        }
    }
    
    updateStats() {
        // Get all thoughts
        const thoughts = this.storage.getAllThoughts();
        
        // Total thoughts
        this.totalThoughtsElement.textContent = thoughts.length;
        
        // Count thoughts by category
        const categoryCounts = {
            philosophy: 0,
            dreams: 0,
            emotions: 0,
            ideas: 0,
            random: 0
        };
        
        thoughts.forEach(thought => {
            if (categoryCounts[thought.category] !== undefined) {
                categoryCounts[thought.category]++;
            }
        });
        
        // Update category counts
        for (const category in categoryCounts) {
            if (this.roomCountElements[category]) {
                this.roomCountElements[category].textContent = categoryCounts[category];
            }
        }
        
        // Most frequent room
        let mostFrequentRoom = 'None';
        let maxCount = 0;
        
        for (const category in categoryCounts) {
            if (categoryCounts[category] > maxCount) {
                maxCount = categoryCounts[category];
                mostFrequentRoom = category.charAt(0).toUpperCase() + category.slice(1);
            }
        }
        
        this.frequentRoomElement.textContent = mostFrequentRoom;
        
        // Daily streak calculation
        const streak = this.calculateStreak(thoughts);
        this.dailyStreakElement.textContent = streak;
    }
    
    calculateStreak(thoughts) {
        if (!thoughts.length) return 0;
        
        // Sort thoughts by date
        const sortedThoughts = [...thoughts].sort((a, b) => 
            new Date(b.created) - new Date(a.created)
        );
        
        // Get unique dates
        const uniqueDates = new Set();
        sortedThoughts.forEach(thought => {
            const date = new Date(thought.created).toLocaleDateString();
            uniqueDates.add(date);
        });
        
        // Convert to array for easier handling
        const dates = Array.from(uniqueDates).map(dateStr => new Date(dateStr));
        
        // Sort dates in descending order
        dates.sort((a, b) => b - a);
        
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // If no thought today, streak is 0
        if (dates.length === 0 || dates[0] < today) {
            return 0;
        }
        
        // Count consecutive days
        let streak = 1;
        let currentDate = today;
        
        for (let i = 1; i < dates.length; i++) {
            // Get the previous day
            const previousDay = new Date(currentDate);
            previousDay.setDate(previousDay.getDate() - 1);
            
            // If the next date in our array matches the previous day, increment streak
            if (dates[i].getTime() === previousDay.getTime()) {
                streak++;
                currentDate = previousDay;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    openRoom(room) {
        this.currentRoom = room;
        
        // Update room title
        this.currentRoomTitle.textContent = this.formatRoomName(room);
        
        // Get thoughts for this room
        const thoughts = this.storage.getThoughtsByCategory(room);
        
        // Clear current thoughts list
        this.thoughtsList.innerHTML = '';
        
        // Add thoughts to the list
        if (thoughts.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-room-message';
            emptyMessage.textContent = `No thoughts in this room yet. Tap the microphone to add your first ${room} thought.`;
            this.thoughtsList.appendChild(emptyMessage);
        } else {
            thoughts.forEach(thought => {
                const thoughtCard = this.createThoughtCard(thought);
                this.thoughtsList.appendChild(thoughtCard);
            });
        }
        
        // Show thoughts view
        this.thoughtsView.classList.remove('hidden');
    }
    
    closeRoom() {
        // Hide thoughts view
        this.thoughtsView.classList.add('hidden');
        this.currentRoom = null;
    }
    
    createThoughtCard(thought) {
        const card = document.createElement('div');
        card.className = 'thought-card glass-effect';
        card.setAttribute('data-id', thought.id);
        card.setAttribute('data-room', thought.category);
        
        // Generate a short excerpt from the thought content
        const excerpt = thought.content.length > 100 
            ? thought.content.substring(0, 100) + '...' 
            : thought.content;
        
        // Format date
        const date = new Date(thought.date);
        const formattedDate = `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
        
        // Create AI-suggested call-to-action based on the room
        let callToAction = '';
        if (thought.category === 'business-ideas') {
            callToAction = `<div class="ai-suggestion">
                <button class="suggestion-button" data-action="business-plan">Build a business plan</button>
            </div>`;
        } else if (thought.category === 'personal-growth') {
            callToAction = `<div class="ai-suggestion">
                <button class="suggestion-button" data-action="growth-plan">Create an action plan</button>
            </div>`;
        } else if (thought.category === 'dreams-visions') {
            callToAction = `<div class="ai-suggestion">
                <button class="suggestion-button" data-action="vision-board">Create a vision board</button>
            </div>`;
        }
        
        card.innerHTML = `
            <h3>${thought.title}</h3>
            <p class="thought-excerpt">${excerpt}</p>
            <div class="thought-meta">
                <span class="thought-date">${formattedDate}</span>
                <span class="thought-category-tag" data-category="${thought.category}">${this.formatRoomName(thought.category)}</span>
            </div>
            ${callToAction}
        `;
        
        card.addEventListener('click', (e) => {
            // If the click is on a suggestion button, handle the action
            if (e.target.classList.contains('suggestion-button')) {
                const action = e.target.getAttribute('data-action');
                this.handleSuggestionAction(thought, action);
                e.stopPropagation();
            } else {
                // Otherwise, open the thought modal
                this.openThoughtModal(thought);
            }
        });
        
        return card;
    }
    
    handleSuggestionAction(thought, action) {
        // Check if user has remaining AI actions
        if (!this.incrementAIUsage()) {
            return; // Premium modal will be shown by incrementAIUsage
        }
        
        // Open the thought with the specific action
        this.openThoughtModal(thought, action);
    }
    
    openThoughtModal(thought, specificAction = null) {
        // Save reference to current thought
        this.currentThought = thought;
        
        // Set modal content
        this.thoughtTitle.textContent = thought.title;
        this.thoughtContent.textContent = thought.content;
        
        // Format room name and date
        this.thoughtRoom.textContent = this.formatRoomName(thought.category);
        this.thoughtRoom.setAttribute('data-category', thought.category);
        
        const date = new Date(thought.date);
        this.thoughtDate.textContent = `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
        
        // Set appropriate AI action based on the room
        this.setupAIAction(thought.category, specificAction);
        
        // Show modal
        this.thoughtModal.classList.remove('hidden');
    }
    
    setupAIAction(category, specificAction = null) {
        // Set appropriate AI action based on the room or specified action
        let actionText = '';
        let actionType = '';
        
        if (specificAction) {
            // Use the specific action requested
            switch (specificAction) {
                case 'business-plan':
                    actionText = 'Build a Business Plan';
                    actionType = 'business-plan';
                    break;
                case 'growth-plan':
                    actionText = 'Create an Action Plan';
                    actionType = 'growth-plan';
                    break;
                case 'vision-board':
                    actionText = 'Create a Vision Board';
                    actionType = 'vision-board';
                    break;
                default:
                    actionText = 'Generate Insight';
                    actionType = 'general-insight';
            }
        } else {
            // Default actions based on room category
            switch (category) {
                case 'business-ideas':
                    actionText = 'Analyze Business Potential';
                    actionType = 'business-analysis';
                    break;
                case 'personal-growth':
                    actionText = 'Generate Growth Plan';
                    actionType = 'personal-growth';
                    break;
                case 'dreams-visions':
                    actionText = 'Visualize Your Dream';
                    actionType = 'dream-visualization';
                    break;
                case 'relationships':
                    actionText = 'Relationship Insight';
                    actionType = 'relationship-insight';
                    break;
                case 'creativity':
                    actionText = 'Expand Creative Idea';
                    actionType = 'creative-expansion';
                    break;
                default:
                    if (this.customRooms.find(r => r.id === category)) {
                        actionText = 'Generate Custom Insight';
                        actionType = 'custom-insight';
                    } else {
                        actionText = 'Generate Insight';
                        actionType = 'general-insight';
                    }
            }
        }
        
        // Update the button
        this.aiActionText.textContent = actionText;
        this.aiActionButton.setAttribute('data-action-type', actionType);
        
        // Show the AI action container
        this.aiActionContainer.classList.remove('hidden');
        
        // Update the remaining actions counter
        this.updatePremiumUI();
    }
    
    handleAIAction() {
        // Get action type
        const actionType = this.aiActionButton.getAttribute('data-action-type');
        
        // Check if user has remaining AI actions
        if (!this.incrementAIUsage()) {
            return; // Premium modal will be shown by incrementAIUsage
        }
        
        // Show loading state
        this.aiActionButton.textContent = 'Generating...';
        this.aiActionButton.disabled = true;
        
        // Generate appropriate AI content based on action type
        setTimeout(() => {
            const insight = this.generateAIContent(actionType, this.currentThought);
            this.showAIResult(insight, actionType);
            
            // Reset button state
            this.aiActionText.textContent = this.aiActionButton.getAttribute('data-action-type').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            this.aiActionButton.disabled = false;
        }, 1500);
    }
    
    generateAIContent(actionType, thought) {
        // In a real app, this would call an AI service
        // For now, we'll return placeholder content based on the action type
        
        const content = thought.content;
        let result = '';
        
        switch (actionType) {
            case 'business-analysis':
                result = this.generateBusinessAnalysis(content);
                break;
            case 'personal-growth':
                result = this.generatePersonalGrowthPlan(content);
                break;
            case 'dream-visualization':
                result = this.generateDreamVisualization(content);
                break;
            case 'relationship-insight':
                result = this.generateRelationshipInsight(content);
                break;
            case 'creative-expansion':
                result = this.generateCreativeExpansion(content);
                break;
            case 'business-plan':
                result = this.generateBusinessPlan(content);
                break;
            case 'growth-plan':
                result = this.generateGrowthPlan(content);
                break;
            case 'vision-board':
                result = this.generateVisionBoard(content);
                break;
            default:
                result = this.generateGeneralInsight(content);
        }
        
        return result;
    }
    
    showAIResult(result, actionType) {
        // Create a modal for showing the AI result
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // Create header based on action type
        let header = '';
        switch (actionType) {
            case 'business-analysis':
                header = 'Business Idea Analysis';
                break;
            case 'personal-growth':
                header = 'Personal Growth Plan';
                break;
            case 'dream-visualization':
                header = 'Dream Visualization';
                break;
            case 'relationship-insight':
                header = 'Relationship Insight';
                break;
            case 'creative-expansion':
                header = 'Creative Expansion';
                break;
            case 'business-plan':
                header = 'Business Plan';
                break;
            case 'growth-plan':
                header = 'Growth Action Plan';
                break;
            case 'vision-board':
                header = 'Vision Board';
                break;
            default:
                header = 'AI Insight';
        }
        
        modal.innerHTML = `
            <div class="modal-content glass-effect">
                <div class="modal-header">
                    <h3>${header}</h3>
                    <span class="close-button ai-result-close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="ai-result">
                        ${result}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="action-button save-insight">Save Insight</button>
                    <button class="action-button share-insight">Share</button>
                </div>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.style.display = 'block';
        }, 100);
        
        // Add event listeners
        const closeButton = modal.querySelector('.ai-result-close');
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
        
        // Handle save and share buttons
        const saveButton = modal.querySelector('.save-insight');
        saveButton.addEventListener('click', () => {
            // In a real app, this would save the insight
            alert('Insight saved!');
        });
        
        const shareButton = modal.querySelector('.share-insight');
        shareButton.addEventListener('click', () => {
            // In a real app, this would share the insight
            if (navigator.share) {
                navigator.share({
                    title: header,
                    text: 'Check out this insight from Mind Castle!',
                    url: window.location.href
                });
            } else {
                alert('Sharing not supported on this browser.');
            }
        });
    }
    
    closeThoughtModal() {
        this.thoughtModal.classList.add('hidden');
        this.currentThought = null;
    }
    
    deleteCurrentThought() {
        if (!this.currentThought) return;
        
        // Confirm deletion
        if (confirm('Are you sure you want to delete this thought?')) {
            // Delete from storage
            this.storage.deleteThought(this.currentThought.id);
            
            // Update UI
            this.removeThoughtFromUI(this.currentThought.id);
            
            // Update counts
            this.updateThoughtCounts();
            
            // Close modal
            this.closeThoughtModal();
        }
    }
    
    removeThoughtFromUI(thoughtId) {
        const thoughtElement = document.querySelector(`.thought-card[data-id="${thoughtId}"]`);
        if (thoughtElement) {
            thoughtElement.remove();
        }
    }
    
    updateThoughtCounts() {
        // Get all thoughts
        const thoughts = this.storage.getAllThoughts();
        
        // Reset counts
        this.totalThoughtCount = 0;
        
        // Count for each room
        const roomCounts = {};
        this.defaultRooms.forEach(room => roomCounts[room] = 0);
        this.customRooms.forEach(room => roomCounts[room.id] = 0);
        
        // Update counts
        thoughts.forEach(thought => {
            this.totalThoughtCount++;
            
            if (roomCounts[thought.category] !== undefined) {
                roomCounts[thought.category]++;
            }
        });
        
        // Update UI
        Object.keys(roomCounts).forEach(roomId => {
            if (this.roomCountElements[roomId]) {
                this.roomCountElements[roomId].textContent = roomCounts[roomId];
            }
        });
        
        // Update total count
        this.roomCountElements.total.textContent = this.totalThoughtCount;
    }
    
    searchThoughts() {
        const query = this.searchInput.value.trim().toLowerCase();
        
        if (!query) return;
        
        // Search for thoughts
        const results = this.storage.searchThoughts(query);
        
        // Display results
        this.currentRoomTitle.textContent = `Search: "${query}"`;
        
        // Clear current thoughts list
        this.thoughtsList.innerHTML = '';
        
        // Add thoughts to the list
        if (results.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-room-message';
            emptyMessage.textContent = 'No thoughts found matching your search.';
            this.thoughtsList.appendChild(emptyMessage);
        } else {
            results.forEach(thought => {
                const thoughtCard = this.createThoughtCard(thought);
                this.thoughtsList.appendChild(thoughtCard);
            });
        }
        
        // Show thoughts view
        this.thoughtsView.classList.remove('hidden');
    }
    
    generateInsight() {
        // Get the current thought content
        const content = this.thoughtContent.textContent;
        
        // Simulate AI insight generation
        // In a real app, this would call an AI API
        const insights = [
            "This thought reveals your desire for connection and understanding.",
            "Consider how this perspective has evolved over time in your life.",
            "This idea has potential for deeper exploration in your daily practices.",
            "The emotions expressed here connect to your core values.",
            "Try reflecting on this thought when you face similar situations in the future.",
            "This perspective shows growth in how you approach challenges.",
            "Your mind is creating valuable connections between different aspects of your life.",
            "This thought represents an important pattern in your thinking.",
            "Consider journaling more about this topic to reveal deeper insights.",
            "This reflection shows mindfulness and awareness of your inner state."
        ];
        
        // Select a random insight
        const randomIndex = Math.floor(Math.random() * insights.length);
        const insight = insights[randomIndex];
        
        // Display the insight
        this.aiActionText.textContent = insight;
        this.aiActionContainer.classList.remove('hidden');
    }
    
    generateTitle(content) {
        // Simple title generation by taking the first 5-7 words
        // In a real app, this would use NLP or AI
        const words = content.trim().split(/\s+/);
        let title = words.slice(0, Math.min(6, words.length)).join(' ');
        
        // Add ellipsis if needed
        if (words.length > 6) {
            title += '...';
        }
        
        // Capitalize first letter
        return title.charAt(0).toUpperCase() + title.slice(1);
    }
    
    categorizeThought(content) {
        // Simple category detection based on keywords
        // In a real app, this would use NLP or AI
        const contentLower = content.toLowerCase();
        
        const categories = {
            philosophy: ['why', 'meaning', 'purpose', 'life', 'existence', 'philosophy', 'truth', 'reality'],
            dreams: ['dream', 'hope', 'future', 'aspiration', 'wish', 'imagine', 'vision'],
            emotions: ['feel', 'emotion', 'happy', 'sad', 'angry', 'love', 'fear', 'excited', 'anxious'],
            ideas: ['idea', 'concept', 'project', 'plan', 'create', 'design', 'solve', 'innovation']
        };
        
        let maxMatches = 0;
        let matchedCategory = 'random';
        
        for (const category in categories) {
            const keywords = categories[category];
            let matches = 0;
            
            keywords.forEach(keyword => {
                if (contentLower.includes(keyword)) {
                    matches++;
                }
            });
            
            if (matches > maxMatches) {
                maxMatches = matches;
                matchedCategory = category;
            }
        }
        
        return matchedCategory;
    }
    
    setupPWAInstall() {
        // Hide the install button initially
        this.installButton.classList.add('hidden');
        
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the default prompt
            e.preventDefault();
            
            // Store the event for later use
            this.deferredPrompt = e;
            
            // Show the install button
            this.installButton.classList.remove('hidden');
        });
        
        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            // Hide the install button
            this.installButton.classList.add('hidden');
            
            // Clear the deferred prompt
            this.deferredPrompt = null;
        });
    }
    
    installApp() {
        if (!this.deferredPrompt) return;
        
        // Show the installation prompt
        this.deferredPrompt.prompt();
        
        // Wait for the user to respond
        this.deferredPrompt.userChoice.then((choiceResult) => {
            // Reset the deferred prompt
            this.deferredPrompt = null;
            
            // Hide the install button
            this.installButton.classList.add('hidden');
        });
    }
    
    checkOnlineStatus() {
        this.handleOnlineStatus(navigator.onLine);
    }
    
    handleOnlineStatus(isOnline) {
        if (isOnline) {
            // Online - hide notification
            this.offlineNotification.classList.add('hidden');
        } else {
            // Offline - show notification
            this.offlineNotification.classList.remove('hidden');
        }
    }
    
    // Custom Room Management
    showCreateRoomModal() {
        // Reset form
        this.roomNameInput.value = '';
        this.selectRoomColor(this.colorOptions[0]);
        
        // Show modal
        this.createRoomModal.classList.remove('hidden');
    }
    
    closeCreateRoomModal() {
        this.createRoomModal.classList.add('hidden');
    }
    
    selectRoomColor(colorOption) {
        // Remove selected class from all options
        this.colorOptions.forEach(option => option.classList.remove('selected'));
        
        // Add selected class to clicked option
        colorOption.classList.add('selected');
        
        // Store selected color
        this.selectedRoomColor.value = colorOption.getAttribute('data-color');
    }
    
    createCustomRoom() {
        const roomName = this.roomNameInput.value.trim();
        
        if (!roomName) {
            alert('Please enter a room name');
            return;
        }
        
        // Create room ID (slugified name)
        const roomId = 'custom-' + roomName.toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-') // Replace spaces with dashes
            .replace(/-+/g, '-') // Replace multiple dashes with single dash
            + '-' + Date.now().toString().substring(9); // Add timestamp suffix for uniqueness
        
        // Create room object
        const room = {
            id: roomId,
            name: roomName,
            color: this.selectedRoomColor.value,
            created: new Date().toISOString()
        };
        
        // Add to custom rooms
        this.customRooms.push(room);
        
        // Save to storage
        this.storage.saveCustomRoom(room);
        
        // Update select options
        this.updateRoomSelectOptions();
        
        // Add room card to UI
        this.addCustomRoomCard(room);
        
        // Close modal
        this.closeCreateRoomModal();
    }
    
    addCustomRoomCard(room) {
        // Create room card
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.setAttribute('data-room', room.id);
        roomCard.style.borderLeftColor = room.color;
        
        // Create room icon
        const roomIcon = document.createElement('div');
        roomIcon.className = 'room-icon';
        roomIcon.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${encodeURIComponent(room.color)}"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>')`;
        
        // Create room content
        roomCard.innerHTML = `
            <h3>${room.name}</h3>
            <p>Custom room</p>
            <span class="card-count" id="${room.id}Count">0</span>
        `;
        
        // Insert room icon at the beginning
        roomCard.insertBefore(roomIcon, roomCard.firstChild);
        
        // Add to room count elements
        this.roomCountElements[room.id] = roomCard.querySelector('.card-count');
        
        // Add click event
        roomCard.addEventListener('click', () => {
            this.openRoom(room.id);
        });
        
        // Add to DOM before the add room card
        this.addRoomCard.parentNode.insertBefore(roomCard, this.addRoomCard);
    }
    
    // Random Memory Feature
    showRandomMemory() {
        const thoughts = this.storage.getAllThoughts();
        
        if (thoughts.length === 0) {
            alert('You don\'t have any memories saved yet. Record some thoughts first!');
            return;
        }
        
        // Select a random thought
        const randomIndex = Math.floor(Math.random() * thoughts.length);
        const randomThought = thoughts[randomIndex];
        this.currentRandomMemory = randomThought;
        
        // Set modal content
        this.randomMemoryTitle.textContent = randomThought.title;
        
        // Create excerpt
        const excerpt = randomThought.content.length > 150 ? 
            randomThought.content.substring(0, 150) + '...' : randomThought.content;
        this.randomMemoryContent.textContent = excerpt;
        
        // Format date
        const date = new Date(randomThought.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        this.randomMemoryDate.textContent = formattedDate;
        
        // Set room name
        let roomName = this.formatRoomName(randomThought.category);
        
        this.randomMemoryRoom.textContent = roomName;
        
        // Set room color
        let roomColor = '';
        if (randomThought.category === 'personal-growth') {
            roomColor = '#61a67c';
        } else if (randomThought.category === 'business-ideas') {
            roomColor = '#e6be8a';
        } else if (randomThought.category === 'dreams-visions') {
            roomColor = '#b798e0';
        } else if (randomThought.category === 'relationships') {
            roomColor = '#e4b5b5';
        } else if (randomThought.category === 'creativity') {
            roomColor = '#7bbfcf';
        } else {
            // Find custom room color
            const customRoom = this.customRooms.find(room => room.id === randomThought.category);
            roomColor = customRoom ? customRoom.color : '#7bbfcf';
        }
        
        this.randomMemoryRoom.style.backgroundColor = roomColor;
        
        // Show modal
        this.randomMemoryModal.classList.remove('hidden');
    }
    
    closeRandomMemoryModal() {
        this.randomMemoryModal.classList.add('hidden');
    }
    
    viewFullRandomMemory() {
        if (!this.currentRandomMemory) return;
        
        // Close random memory modal
        this.closeRandomMemoryModal();
        
        // Open thought modal with the full memory
        this.openThoughtModal(this.currentRandomMemory);
    }
    
    formatRoomName(roomId) {
        // Check if it's a default room
        if (this.defaultRooms.includes(roomId)) {
            // Format default room names by capitalizing and replacing hyphens
            return roomId
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        } else {
            // Find custom room name
            const customRoom = this.customRooms.find(room => room.id === roomId);
            return customRoom ? customRoom.name : 'Unknown Room';
        }
    }
    
    displayRandomThought() {
        const thoughts = this.storage.getAllThoughts();
        
        if (thoughts.length === 0) {
            // No thoughts yet
            alert("You haven't recorded any thoughts yet. Add some thoughts to see random memories.");
            return;
        }
        
        // Pick a random thought
        const randomIndex = Math.floor(Math.random() * thoughts.length);
        const randomThought = thoughts[randomIndex];
        
        // Create modal content
        const randomMemoryContent = document.createElement('div');
        randomMemoryContent.className = 'random-memory-content';
        
        // Get room color and name
        let roomColor = '';
        let roomName = this.formatRoomName(randomThought.category);
        
        if (randomThought.category === 'personal-growth') {
            roomColor = '#61a67c';
        } else if (randomThought.category === 'business-ideas') {
            roomColor = '#e6be8a';
        } else if (randomThought.category === 'dreams-visions') {
            roomColor = '#b798e0';
        } else if (randomThought.category === 'relationships') {
            roomColor = '#e4b5b5';
        } else if (randomThought.category === 'creativity') {
            roomColor = '#7bbfcf';
        } else {
            // Find custom room color
            const customRoom = this.customRooms.find(room => room.id === randomThought.category);
            roomColor = customRoom ? customRoom.color : '#7bbfcf';
        }
        
        // Format date
        const date = new Date(randomThought.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Build content HTML
        randomMemoryContent.innerHTML = `
            <div class="random-memory-header">
                <h2>${randomThought.title}</h2>
                <span class="memory-room" style="background-color: ${roomColor}">${roomName}</span>
            </div>
            <p class="memory-content">${randomThought.content}</p>
            <div class="memory-footer">
                <span class="memory-date">${formattedDate}</span>
            </div>
        `;
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <div class="modal-body"></div>
            </div>
        `;
        
        // Add content to modal
        modal.querySelector('.modal-body').appendChild(randomMemoryContent);
        
        // Add close button functionality
        modal.querySelector('.close-button').addEventListener('click', () => {
            modal.remove();
        });
        
        // Add modal to DOM
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
    }
    
    checkPremiumStatus() {
        // Check if user has premium status
        const userData = this.storage.getUserData();
        this.isPremium = userData && userData.isPremium || false;
        
        // Update UI based on premium status
        this.updatePremiumUI();
    }
    
    updatePremiumUI() {
        // Update UI elements based on premium status
        if (this.isPremium) {
            // Premium users have unlimited AI actions
            this.aiUsageCounter.textContent = 'Unlimited AI actions (Premium)';
            this.mindEchoInterval = 0.5; // 2 per day for premium users
        } else {
            // Free users have limited AI actions
            const remainingActions = this.aiDailyUsageLimit - this.aiDailyUsageCount;
            this.aiUsageCounter.textContent = `You have ${remainingActions} AI actions remaining today`;
        }
    }
    
    loadAIUsageData() {
        // Load AI usage data from storage
        const today = new Date().toDateString();
        const aiUsageData = this.storage.getAIUsageData();
        
        if (aiUsageData && aiUsageData.date === today) {
            // If we have data from today, use it
            this.aiDailyUsageCount = aiUsageData.count || 0;
        } else {
            // Reset usage count for a new day
            this.aiDailyUsageCount = 0;
            this.storage.saveAIUsageData({
                date: today,
                count: 0
            });
        }
        
        // Update UI
        this.updatePremiumUI();
    }
    
    incrementAIUsage() {
        // Don't increment for premium users
        if (this.isPremium) return true;
        
        // Check if user has reached their daily limit
        if (this.aiDailyUsageCount >= this.aiDailyUsageLimit) {
            this.showPremiumModal();
            return false;
        }
        
        // Increment usage count
        const today = new Date().toDateString();
        this.aiDailyUsageCount++;
        
        // Save updated count
        this.storage.saveAIUsageData({
            date: today,
            count: this.aiDailyUsageCount
        });
        
        // Update UI
        this.updatePremiumUI();
        return true;
    }
    
    showPremiumModal() {
        // Show the premium upgrade modal
        this.premiumModal.style.display = 'block';
    }
    
    closePremiumModal() {
        // Close the premium upgrade modal
        this.premiumModal.style.display = 'none';
    }
    
    handleUpgrade() {
        // This would normally connect to payment processing
        // For now, just simulate upgrading to premium
        const userData = this.storage.getUserData() || {};
        userData.isPremium = true;
        this.storage.saveUserData(userData);
        
        // Update app state
        this.isPremium = true;
        this.updatePremiumUI();
        
        // Close modal
        this.closePremiumModal();
        
        // Show success message
        alert('You have successfully upgraded to Mind Castle Premium!');
    }
    
    checkMindEchoEligibility() {
        // Check if it's time to show a Mind Echo (memory reminder)
        const lastEchoData = this.storage.getLastMindEchoData();
        const today = new Date();
        
        if (lastEchoData && lastEchoData.date) {
            const lastDate = new Date(lastEchoData.date);
            const daysSinceLastEcho = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
            
            // Determine if enough time has passed based on user's plan
            if ((this.isPremium && daysSinceLastEcho >= 0.5) || // Premium: 2 per day (every 12 hours)
                (!this.isPremium && daysSinceLastEcho >= this.mindEchoInterval)) { // Free: every 3 days
                
                // Find Mind Echo candidates
                this.findMindEchoCandidates();
                
                // If we have candidates and it's a new day, show notification
                if (this.mindEchoCandidates.length > 0 && lastDate.toDateString() !== today.toDateString()) {
                    this.showMindEchoNotification();
                }
            }
        } else {
            // No previous Mind Echo, check if we have thoughts to remind about
            this.findMindEchoCandidates();
            
            // If we have candidates, show notification
            if (this.mindEchoCandidates.length > 0) {
                this.showMindEchoNotification();
            }
        }
    }
    
    findMindEchoCandidates() {
        // Get all thoughts
        const allThoughts = this.storage.getAllThoughts();
        
        // Filter for thoughts that are good candidates for Mind Echo
        // Criteria: emotional or action-oriented content, at least 7 days old
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        this.mindEchoCandidates = allThoughts.filter(thought => {
            // Check if thought is old enough
            const thoughtDate = new Date(thought.date);
            if (thoughtDate > sevenDaysAgo) return false;
            
            // Simple heuristic for emotional or action-oriented content
            // In a real app, this could use AI analysis
            const content = thought.content.toLowerCase();
            const emotionalKeywords = ['feel', 'happy', 'sad', 'excited', 'worry', 'anxious', 'hope', 'dream', 'love', 'miss'];
            const actionKeywords = ['plan', 'goal', 'achieve', 'start', 'finish', 'build', 'create', 'launch', 'learn'];
            
            const hasEmotionalContent = emotionalKeywords.some(keyword => content.includes(keyword));
            const hasActionContent = actionKeywords.some(keyword => content.includes(keyword));
            
            return hasEmotionalContent || hasActionContent;
        });
    }
    
    showMindEchoNotification() {
        // Show notification that a memory is ready to be reminded
        // In a real app, this would use the Notifications API
        this.remindMeButton.classList.add('pulse-notification');
    }

    generateBusinessAnalysis(content) {
        // Generate a business analysis based on the thought content
        const lines = content.split(/[.!?]+/).filter(line => line.trim().length > 0);
        
        // Extract key components that might be in the business idea
        const keyFeatures = this.extractKeyFeatures(content);
        const targetMarket = this.extractTargetMarket(content);
        const potentialChallenges = this.extractChallenges(content);
        
        // Generate HTML for the analysis
        return `
            <div class="analysis-section">
                <h3>Business Idea Overview</h3>
                <p>${this.summarizeBusiness(content)}</p>
            </div>
            
            <div class="analysis-section">
                <h3>Key Components</h3>
                <ul>
                    ${keyFeatures.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Potential Market</h3>
                <p>${targetMarket}</p>
            </div>
            
            <div class="analysis-section">
                <h3>Challenges to Consider</h3>
                <ul>
                    ${potentialChallenges.map(challenge => `<li>${challenge}</li>`).join('')}
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Next Steps</h3>
                <ol>
                    <li>Research competitors in the market</li>
                    <li>Validate your core assumptions</li>
                    <li>Create a minimum viable product (MVP)</li>
                    <li>Gather feedback from potential customers</li>
                </ol>
            </div>
        `;
    }
    
    extractKeyFeatures(content) {
        // In a real app, this would use NLP to extract key features
        // For now, we'll return some generic features
        return [
            "Innovative solution for a common problem",
            "Potential for recurring revenue model",
            "Scalable technology platform",
            "Low initial investment required"
        ];
    }
    
    extractTargetMarket(content) {
        // In a real app, this would analyze the content to determine the target market
        return "Based on your idea, your primary market appears to be professionals aged 25-40 who are tech-savvy and value convenience. This is a growing market segment with strong purchasing power and willingness to adopt new solutions.";
    }
    
    extractChallenges(content) {
        // In a real app, this would analyze the content to identify potential challenges
        return [
            "Potential regulatory hurdles in certain markets",
            "Need for initial user acquisition strategy",
            "Possible technical scalability challenges",
            "Competition from established players"
        ];
    }
    
    summarizeBusiness(content) {
        // In a real app, this would use NLP to summarize the business idea
        return "Your business idea focuses on solving a specific problem through an innovative approach. It has potential for market disruption if executed well, with a clear value proposition for the target users.";
    }
    
    generatePersonalGrowthPlan(content) {
        // Generate a personal growth plan based on the thought content
        const goals = this.extractGoals(content);
        const strengths = this.extractStrengths(content);
        const areas = this.extractGrowthAreas(content);
        
        return `
            <div class="analysis-section">
                <h3>Growth Reflection</h3>
                <p>${this.summarizeGrowth(content)}</p>
            </div>
            
            <div class="analysis-section">
                <h3>Identified Goals</h3>
                <ul>
                    ${goals.map(goal => `<li>${goal}</li>`).join('')}
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Your Strengths</h3>
                <ul>
                    ${strengths.map(strength => `<li>${strength}</li>`).join('')}
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Growth Opportunities</h3>
                <ul>
                    ${areas.map(area => `<li>${area}</li>`).join('')}
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Action Plan</h3>
                <ol>
                    <li>Set specific, measurable goals with deadlines</li>
                    <li>Create a daily practice to build momentum</li>
                    <li>Find an accountability partner or community</li>
                    <li>Review and adjust your approach weekly</li>
                </ol>
            </div>
        `;
    }
    
    extractGoals(content) {
        // In a real app, this would use NLP to extract goals from the content
        return [
            "Build a consistent daily routine",
            "Improve technical skills in specific area",
            "Expand professional network",
            "Achieve better work-life balance"
        ];
    }
    
    extractStrengths(content) {
        // In a real app, this would analyze the content to determine strengths
        return [
            "Self-awareness and willingness to improve",
            "Ability to identify specific areas for growth",
            "Motivation to take action",
            "Reflective thinking"
        ];
    }
    
    extractGrowthAreas(content) {
        // In a real app, this would analyze the content to identify growth areas
        return [
            "Creating and maintaining consistent habits",
            "Setting specific, measurable goals",
            "Finding balance between different life areas",
            "Tracking progress systematically"
        ];
    }
    
    summarizeGrowth(content) {
        // In a real app, this would use NLP to summarize the growth thoughts
        return "Your reflection shows a desire for personal improvement and growth. You've identified specific areas to focus on and seem motivated to make positive changes in your life.";
    }
    
    generateDreamVisualization(content) {
        // Generate a dream visualization based on the thought content
        const keyElements = this.extractDreamElements(content);
        const motivations = this.extractMotivations(content);
        const steps = this.extractDreamSteps(content);
        
        return `
            <div class="analysis-section dream-section">
                <h3>Dream Vision</h3>
                <p>${this.summarizeDream(content)}</p>
            </div>
            
            <div class="analysis-section">
                <h3>Key Elements</h3>
                <ul>
                    ${keyElements.map(element => `<li>${element}</li>`).join('')}
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Underlying Motivations</h3>
                <ul>
                    ${motivations.map(motivation => `<li>${motivation}</li>`).join('')}
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Path Forward</h3>
                <ol>
                    ${steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>
            
            <div class="analysis-section">
                <h3>Vision Board Elements</h3>
                <p>Consider adding these elements to a vision board to visualize your dream daily:</p>
                <ul>
                    <li>Images representing your end goal</li>
                    <li>Words and phrases that evoke the feeling of achievement</li>
                    <li>Quotes that inspire you to take action</li>
                    <li>Representations of the impact you'll make</li>
                </ul>
            </div>
        `;
    }
    
    extractDreamElements(content) {
        // In a real app, this would use NLP to extract key elements of the dream
        return [
            "Long-term financial freedom",
            "Creative fulfillment",
            "Helping others and making an impact",
            "Building something meaningful"
        ];
    }
    
    extractMotivations(content) {
        // In a real app, this would analyze the content to determine motivations
        return [
            "Desire for autonomy and self-direction",
            "Need to express creativity",
            "Wish to leave a positive legacy",
            "Aspiration for personal growth"
        ];
    }
    
    extractDreamSteps(content) {
        // In a real app, this would analyze the content to suggest steps
        return [
            "Define what success looks like in specific terms",
            "Break down your vision into 90-day action plans",
            "Identify skills and resources needed",
            "Find mentors or models who have achieved similar dreams",
            "Create daily habits that move you toward your vision"
        ];
    }
    
    summarizeDream(content) {
        // In a real app, this would use NLP to summarize the dream
        return "Your vision reflects a deep desire to create something meaningful that aligns with your values and brings both personal fulfillment and positive impact to others.";
    }
    
    generateRelationshipInsight(content) {
        // Generate relationship insights based on the thought content
        const patterns = this.extractRelationshipPatterns(content);
        const strengths = this.extractRelationshipStrengths(content);
        const areas = this.extractRelationshipGrowthAreas(content);
        
        return `
            <div class="analysis-section">
                <h3>Relationship Reflection</h3>
                <p>${this.summarizeRelationship(content)}</p>
            </div>
            
            <div class="analysis-section">
                <h3>Observed Patterns</h3>
                <ul>
                    ${patterns.map(pattern => `<li>${pattern}</li>`).join('')}
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Relationship Strengths</h3>
                <ul>
                    ${strengths.map(strength => `<li>${strength}</li>`).join('')}
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Growth Opportunities</h3>
                <ul>
                    ${areas.map(area => `<li>${area}</li>`).join('')}
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Suggested Approaches</h3>
                <ol>
                    <li>Practice active listening without immediate response</li>
                    <li>Express appreciation for specific actions</li>
                    <li>Clarify expectations and boundaries</li>
                    <li>Schedule regular quality time without distractions</li>
                </ol>
            </div>
        `;
    }
    
    extractRelationshipPatterns(content) {
        // In a real app, this would use NLP to extract relationship patterns
        return [
            "Communication styles that create connection",
            "Recurring themes in interactions",
            "Balance of giving and receiving",
            "Response to challenging situations"
        ];
    }
    
    extractRelationshipStrengths(content) {
        // In a real app, this would analyze the content to determine relationship strengths
        return [
            "Willingness to reflect and grow",
            "Desire for authentic connection",
            "Awareness of relationship dynamics",
            "Value placed on meaningful relationships"
        ];
    }
    
    extractRelationshipGrowthAreas(content) {
        // In a real app, this would analyze the content to identify growth areas
        return [
            "Expressing needs and boundaries clearly",
            "Active listening without planning a response",
            "Managing expectations vs. reality",
            "Creating consistent quality connection time"
        ];
    }
    
    summarizeRelationship(content) {
        // In a real app, this would use NLP to summarize relationship thoughts
        return "Your reflection shows thoughtful consideration of your relationships and how they impact your life. You value authentic connection and are willing to put in effort to nurture important relationships.";
    }
    
    generateCreativeExpansion(content) {
        // Generate creative expansion based on the thought content
        const elements = this.extractCreativeElements(content);
        const directions = this.extractCreativeDirections(content);
        const applications = this.extractCreativeApplications(content);
        
        return `
            <div class="analysis-section">
                <h3>Creative Insight</h3>
                <p>${this.summarizeCreative(content)}</p>
            </div>
            
            <div class="analysis-section">
                <h3>Core Elements</h3>
                <ul>
                    ${elements.map(element => `<li>${element}</li>`).join('')}
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Potential Directions</h3>
                <ul>
                    ${directions.map(direction => `<li>${direction}</li>`).join('')}
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Practical Applications</h3>
                <ul>
                    ${applications.map(application => `<li>${application}</li>`).join('')}
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Creative Process Next Steps</h3>
                <ol>
                    <li>Capture additional ideas and variations</li>
                    <li>Seek inspiration from diverse sources</li>
                    <li>Prototype or sketch your concept</li>
                    <li>Share for feedback from trusted sources</li>
                    <li>Refine based on insights and intuition</li>
                </ol>
            </div>
        `;
    }
    
    extractCreativeElements(content) {
        // In a real app, this would use NLP to extract creative elements
        return [
            "Novel combination of existing ideas",
            "Unique perspective on a common theme",
            "Emotional resonance potential",
            "Distinctive visual or conceptual elements"
        ];
    }
    
    extractCreativeDirections(content) {
        // In a real app, this would analyze the content to suggest creative directions
        return [
            "Explore contrasting elements for tension and interest",
            "Consider simplifying to focus on the core message",
            "Experiment with different media or formats",
            "Investigate historical or cultural connections"
        ];
    }
    
    extractCreativeApplications(content) {
        // In a real app, this would analyze the content to suggest applications
        return [
            "Digital content creation",
            "Physical product or artwork",
            "Performance or experiential piece",
            "Educational or instructional content"
        ];
    }
    
    summarizeCreative(content) {
        // In a real app, this would use NLP to summarize creative thoughts
        return "Your creative idea shows originality and potential for development. It combines familiar elements in a fresh way and has multiple possible directions for exploration.";
    }
    
    generateBusinessPlan(content) {
        // Generate a business plan based on the thought content
        return `
            <div class="analysis-section">
                <h3>Business Plan Outline</h3>
                <p>Based on your idea, here's a high-level business plan structure:</p>
            </div>
            
            <div class="analysis-section">
                <h3>1. Executive Summary</h3>
                <p>A concise overview of your business concept, target market, unique value proposition, and growth potential.</p>
            </div>
            
            <div class="analysis-section">
                <h3>2. Business Description</h3>
                <p>Detailed explanation of your business model, products/services, and how you'll solve customer problems.</p>
            </div>
            
            <div class="analysis-section">
                <h3>3. Market Analysis</h3>
                <p>Research on your target audience, market size, trends, and competitive landscape.</p>
            </div>
            
            <div class="analysis-section">
                <h3>4. Organization Structure</h3>
                <p>Team composition, roles, and responsibilities. Include any advisors or partners.</p>
            </div>
            
            <div class="analysis-section">
                <h3>5. Marketing Strategy</h3>
                <p>Customer acquisition approach, pricing strategy, and promotion channels.</p>
            </div>
            
            <div class="analysis-section">
                <h3>6. Financial Projections</h3>
                <p>Startup costs, revenue forecasts, break-even analysis, and funding requirements.</p>
            </div>
            
            <div class="analysis-section">
                <h3>7. Implementation Timeline</h3>
                <p>Key milestones and deadlines for launching and growing your business.</p>
            </div>
        `;
    }
    
    generateGrowthPlan(content) {
        // Generate a growth plan based on the thought content
        return `
            <div class="analysis-section">
                <h3>Personal Growth Action Plan</h3>
                <p>Based on your reflection, here's a structured plan for your growth journey:</p>
            </div>
            
            <div class="analysis-section">
                <h3>1. Clarity & Vision</h3>
                <ul>
                    <li>Define your specific goal in measurable terms</li>
                    <li>Identify why this goal matters deeply to you</li>
                    <li>Visualize your life after achieving this goal</li>
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>2. Skills & Knowledge</h3>
                <ul>
                    <li>List the specific skills you need to develop</li>
                    <li>Identify learning resources (books, courses, mentors)</li>
                    <li>Create a learning schedule with deadlines</li>
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>3. Daily Practices</h3>
                <ul>
                    <li>Morning routine to set your intention</li>
                    <li>Specific daily actions that build momentum</li>
                    <li>Evening review to reflect on progress</li>
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>4. Environment & Support</h3>
                <ul>
                    <li>Adjust your environment to support your goal</li>
                    <li>Connect with like-minded individuals</li>
                    <li>Find an accountability partner or coach</li>
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>5. Tracking & Celebrating</h3>
                <ul>
                    <li>System for measuring progress</li>
                    <li>Regular review schedule (weekly/monthly)</li>
                    <li>Meaningful rewards for milestone achievements</li>
                </ul>
            </div>
        `;
    }
    
    generateVisionBoard(content) {
        // Generate vision board guidance based on the thought content
        return `
            <div class="analysis-section">
                <h3>Vision Board Elements</h3>
                <p>Based on your dream, here are elements to include in your vision board:</p>
            </div>
            
            <div class="analysis-section">
                <h3>1. Core Imagery</h3>
                <ul>
                    <li>Images that represent your end goal</li>
                    <li>Visual metaphors for your journey</li>
                    <li>Symbols of achievement and success</li>
                    <li>People who inspire you or represent your aspiration</li>
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>2. Powerful Words</h3>
                <ul>
                    <li>Keywords that capture your dream (e.g., "Create," "Growth")</li>
                    <li>Affirmations that support your vision</li>
                    <li>Quotes from inspirational figures</li>
                    <li>Personal mantras that motivate you</li>
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>3. Emotional Elements</h3>
                <ul>
                    <li>Colors that evoke the feeling of your dream</li>
                    <li>Images that trigger positive emotions</li>
                    <li>Representations of how you'll feel when successful</li>
                    <li>Symbols of the impact you'll make</li>
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>4. Practical Tips</h3>
                <ul>
                    <li>Place your vision board somewhere you'll see it daily</li>
                    <li>Include a mix of short-term and long-term goals</li>
                    <li>Update it periodically as you evolve</li>
                    <li>Take time to connect with it through visualization</li>
                </ul>
            </div>
        `;
    }
    
    generateGeneralInsight(content) {
        // Generate general insights based on the thought content
        return `
            <div class="analysis-section">
                <h3>Thought Reflection</h3>
                <p>Your thought reveals interesting patterns and insights that may be valuable to explore further:</p>
            </div>
            
            <div class="analysis-section">
                <h3>Key Themes</h3>
                <ul>
                    <li>Personal reflection and self-awareness</li>
                    <li>Desire for growth and improvement</li>
                    <li>Consideration of different perspectives</li>
                    <li>Balance between pragmatism and aspiration</li>
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Questions to Consider</h3>
                <ul>
                    <li>What specific actions could you take based on this thought?</li>
                    <li>How does this connect to your broader life patterns?</li>
                    <li>What might be beneath the surface of this reflection?</li>
                    <li>How might this thought guide your next steps?</li>
                </ul>
            </div>
            
            <div class="analysis-section">
                <h3>Potential Next Steps</h3>
                <ul>
                    <li>Journal more deeply about this topic</li>
                    <li>Discuss with a trusted friend for additional perspective</li>
                    <li>Set a specific intention based on this reflection</li>
                    <li>Schedule time to revisit this thought in 30 days</li>
                </ul>
            </div>
        `;
    }

    // Add methods to Storage class for premium features
    // ... existing code ...
}

class MindCastleStorage {
    constructor() {
        // Storage keys
        this.THOUGHTS_KEY = 'mindcastle_thoughts';
        this.CUSTOM_ROOMS_KEY = 'mindcastle_custom_rooms';
        this.USER_DATA_KEY = 'mindcastle_user_data';
        this.AI_USAGE_KEY = 'mindcastle_ai_usage';
        this.MIND_ECHO_KEY = 'mindcastle_mind_echo';
        
        // Initialize storage if empty
        if (!localStorage.getItem(this.THOUGHTS_KEY)) {
            localStorage.setItem(this.THOUGHTS_KEY, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(this.CUSTOM_ROOMS_KEY)) {
            localStorage.setItem(this.CUSTOM_ROOMS_KEY, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(this.USER_DATA_KEY)) {
            const defaultUserData = {
                isPremium: false,
                lastLogin: new Date().toISOString(),
                settings: {
                    enableMindEcho: true,
                    theme: 'default'
                }
            };
            localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(defaultUserData));
        }
    }
    
    getAllThoughts() {
        try {
            const thoughts = JSON.parse(localStorage.getItem(this.THOUGHTS_KEY)) || [];
            // Sort by date, newest first
            return thoughts.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error getting thoughts:', error);
            return [];
        }
    }
    
    saveThought(thought) {
        try {
            const thoughts = this.getAllThoughts();
            thoughts.unshift(thought); // Add to beginning of array
            localStorage.setItem(this.THOUGHTS_KEY, JSON.stringify(thoughts));
            return true;
        } catch (error) {
            console.error('Error saving thought:', error);
            return false;
        }
    }
    
    getThoughtById(id) {
        const thoughts = this.getAllThoughts();
        return thoughts.find(thought => thought.id === id);
    }
    
    getThoughtsByCategory(category) {
        const thoughts = this.getAllThoughts();
        return thoughts.filter(thought => thought.category === category);
    }
    
    searchThoughts(query) {
        if (!query) return [];
        
        const thoughts = this.getAllThoughts();
        const lowerQuery = query.toLowerCase();
        
        return thoughts.filter(thought => 
            thought.title.toLowerCase().includes(lowerQuery) || 
            thought.content.toLowerCase().includes(lowerQuery)
        );
    }
    
    deleteThought(id) {
        try {
            const thoughts = this.getAllThoughts();
            const updatedThoughts = thoughts.filter(thought => thought.id !== id);
            localStorage.setItem(this.THOUGHTS_KEY, JSON.stringify(updatedThoughts));
            return true;
        } catch (error) {
            console.error('Error deleting thought:', error);
            return false;
        }
    }
    
    getCustomRooms() {
        try {
            return JSON.parse(localStorage.getItem(this.CUSTOM_ROOMS_KEY)) || [];
        } catch (error) {
            console.error('Error getting custom rooms:', error);
            return [];
        }
    }
    
    saveCustomRoom(room) {
        try {
            const rooms = this.getCustomRooms();
            rooms.push(room);
            localStorage.setItem(this.CUSTOM_ROOMS_KEY, JSON.stringify(rooms));
            return true;
        } catch (error) {
            console.error('Error saving custom room:', error);
            return false;
        }
    }
    
    deleteCustomRoom(id) {
        try {
            const rooms = this.getCustomRooms();
            const updatedRooms = rooms.filter(room => room.id !== id);
            localStorage.setItem(this.CUSTOM_ROOMS_KEY, JSON.stringify(updatedRooms));
            return true;
        } catch (error) {
            console.error('Error deleting custom room:', error);
            return false;
        }
    }
    
    getUserData() {
        try {
            return JSON.parse(localStorage.getItem(this.USER_DATA_KEY)) || null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }
    
    saveUserData(userData) {
        try {
            localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    }
    
    getAIUsageData() {
        try {
            return JSON.parse(localStorage.getItem(this.AI_USAGE_KEY)) || null;
        } catch (error) {
            console.error('Error getting AI usage data:', error);
            return null;
        }
    }
    
    saveAIUsageData(usageData) {
        try {
            localStorage.setItem(this.AI_USAGE_KEY, JSON.stringify(usageData));
            return true;
        } catch (error) {
            console.error('Error saving AI usage data:', error);
            return false;
        }
    }
    
    getLastMindEchoData() {
        try {
            return JSON.parse(localStorage.getItem(this.MIND_ECHO_KEY)) || null;
        } catch (error) {
            console.error('Error getting Mind Echo data:', error);
            return null;
        }
    }
    
    saveMindEchoData(echoData) {
        try {
            localStorage.setItem(this.MIND_ECHO_KEY, JSON.stringify(echoData));
            return true;
        } catch (error) {
            console.error('Error saving Mind Echo data:', error);
            return false;
        }
    }
    
    getMindEchoCandidates() {
        // Get thoughts that are good for Mind Echo reminders
        const thoughts = this.getAllThoughts();
        
        // Find emotional or action-oriented thoughts that are at least 7 days old
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        return thoughts.filter(thought => {
            // Check if thought is old enough
            const thoughtDate = new Date(thought.date);
            if (thoughtDate > sevenDaysAgo) return false;
            
            // Check if thought is marked as an Echo candidate
            return thought.isEchoCandiate === true;
        });
    }
}

function handleBusinessAnalysis() {
    const thoughtModal = document.querySelector('.thought-modal');
    const thoughtId = thoughtModal.getAttribute('data-thought-id');
    const thoughtContent = document.querySelector('.thought-content').textContent;
    
    if (!thoughtId) {
        showNotification('Error: Thought not found', 'error');
        return;
    }
    
    // Show loading state
    const button = document.querySelector('[data-feature="business-analysis"]');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    button.disabled = true;
    
    // Simulate API call (replace with actual API call in production)
    setTimeout(() => {
        // Reset button
        button.innerHTML = originalText;
        button.disabled = false;
        
        // Show analysis result in a new modal
        showBusinessAnalysisResults(thoughtContent);
    }, 2000);
}

function showBusinessAnalysisResults(thoughtContent) {
    // Create analysis results (in production, this would come from the API)
    const analysis = {
        summary: "Your business idea shows potential in the current market.",
        strengths: [
            "Innovative approach to solving a common problem",
            "Clear target audience identification",
            "Potential for scalability"
        ],
        weaknesses: [
            "May require significant initial investment",
            "Potential regulatory challenges to consider",
            "Competition from established players"
        ],
        opportunities: [
            "Growing market demand for this type of solution",
            "Possible partnerships with related services",
            "International expansion possibilities"
        ],
        suggestions: [
            "Consider a staged rollout strategy",
            "Explore funding options early",
            "Develop a clear unique selling proposition"
        ]
    };
    
    // Create modal HTML
    const modalHTML = `
        <div class="analysis-modal">
            <div class="analysis-modal-content">
                <div class="analysis-header">
                    <h3><i class="fas fa-chart-line"></i> Business Analysis</h3>
                    <button class="close-button"><i class="fas fa-times"></i></button>
                </div>
                <div class="analysis-body">
                    <div class="analysis-summary">
                        <h4>Summary</h4>
                        <p>${analysis.summary}</p>
                    </div>
                    <div class="analysis-details">
                        <div class="analysis-column">
                            <h4><i class="fas fa-plus-circle"></i> Strengths</h4>
                            <ul>
                                ${analysis.strengths.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                            <h4><i class="fas fa-lightbulb"></i> Opportunities</h4>
                            <ul>
                                ${analysis.opportunities.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="analysis-column">
                            <h4><i class="fas fa-minus-circle"></i> Weaknesses</h4>
                            <ul>
                                ${analysis.weaknesses.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                            <h4><i class="fas fa-magic"></i> Suggestions</h4>
                            <ul>
                                ${analysis.suggestions.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="analysis-footer">
                    <button class="save-analysis-button">Save Analysis</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to document
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-overlay';
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Add event listeners
    modalContainer.querySelector('.close-button').addEventListener('click', function() {
        document.body.removeChild(modalContainer);
    });
    
    modalContainer.querySelector('.save-analysis-button').addEventListener('click', function() {
        // Placeholder for saving analysis functionality
        showNotification('Analysis saved successfully', 'success');
        document.body.removeChild(modalContainer);
    });
}

// Format room name for display
function formatRoomName(roomId) {
    // Check if it's a default room
    if (defaultRooms.includes(roomId)) {
        // Format default room name (capitalize first letter of each word, replace hyphens with spaces)
        return roomId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    } else {
        // For custom rooms, find the room name from roomList
        const customRoom = roomList.find(room => room.id === roomId);
        return customRoom ? customRoom.name : 'Unknown Room';
    }
}

// Business Analysis Modal Functions
function openAnalysisModal() {
    document.getElementById('analysis-modal').style.display = 'block';
    document.getElementById('analysis-loading').classList.remove('hidden');
    document.getElementById('analysis-content').classList.add('hidden');
    
    // Simulate analysis process
    setTimeout(() => {
        document.getElementById('analysis-loading').classList.add('hidden');
        document.getElementById('analysis-content').classList.remove('hidden');
        generateAnalysisContent();
    }, 2000);
}

function closeAnalysisModal() {
    document.getElementById('analysis-modal').style.display = 'none';
}

function generateAnalysisContent() {
    const analysisContent = document.getElementById('analysis-content');
    
    // Get relevant data for analysis
    const totalRooms = roomList.length;
    const activeUsers = getActiveUsers(); // This would be implemented based on your user tracking
    const popularRooms = getPopularRooms(); // This would analyze room activity
    
    // Create analysis HTML
    let html = `
        <h3>Business Summary</h3>
        <div class="insight-card">
            <p>Your Mind Castle currently has <span class="highlight">${totalRooms} rooms</span> with 
            <span class="highlight">${activeUsers} active users</span> this month.</p>
        </div>
        
        <h3>Popular Rooms</h3>
        <ul>
    `;
    
    // Add popular rooms
    popularRooms.forEach(room => {
        html += `<li><span class="highlight">${room.name}</span>: ${room.visitors} visitors</li>`;
    });
    
    html += `
        </ul>
        
        <h3>Growth Opportunities</h3>
        <div class="insight-card">
            <p>Based on user engagement patterns, consider adding more rooms in the 
            <span class="highlight">${getRecommendedCategory()}</span> category.</p>
        </div>
    `;
    
    analysisContent.innerHTML = html;
}

// Placeholder functions for data analysis
function getActiveUsers() {
    // This would normally fetch actual user data
    return Math.floor(Math.random() * 100) + 50;
}

function getPopularRooms() {
    // In a real app, this would analyze actual room visit data
    const sampleRooms = [
        { name: "Memory Palace", visitors: Math.floor(Math.random() * 100) + 20 },
        { name: "Study Room", visitors: Math.floor(Math.random() * 100) + 10 },
        { name: "Creative Workshop", visitors: Math.floor(Math.random() * 100) + 5 }
    ];
    
    return sampleRooms.sort((a, b) => b.visitors - a.visitors);
}

function getRecommendedCategory() {
    const categories = ["Learning", "Creativity", "Productivity", "Relaxation"];
    return categories[Math.floor(Math.random() * categories.length)];
}

function downloadAnalysis() {
    // Create a blob with the analysis content
    const analysisContent = document.getElementById('analysis-content').innerText;
    const blob = new Blob([`Mind Castle Business Analysis\n\n${analysisContent}`], { type: 'text/plain' });
    
    // Create download link and trigger click
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mind-castle-analysis.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function shareAnalysis() {
    // In a real app, this would open a share dialog with various platforms
    alert('Share functionality would be implemented here, connecting to social media platforms and email.');
}

// Event Listeners for Business Analysis Modal
document.addEventListener('DOMContentLoaded', function() {
    // Button to open analysis modal
    const analysisButton = document.getElementById('open-analysis-btn');
    if (analysisButton) {
        analysisButton.addEventListener('click', openAnalysisModal);
    }
    
    // Close button
    const closeAnalysisBtn = document.querySelector('.close-analysis');
    if (closeAnalysisBtn) {
        closeAnalysisBtn.addEventListener('click', closeAnalysisModal);
    }
    
    // Close when clicking outside modal
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('analysis-modal');
        if (event.target === modal) {
            closeAnalysisModal();
        }
    });
    
    // Download button
    const downloadBtn = document.getElementById('download-analysis-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadAnalysis);
    }
    
    // Share button
    const shareBtn = document.getElementById('share-analysis-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', shareAnalysis);
    }
}); 