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
        this.closeModalButton = document.getElementById('closeModal');
        this.thoughtTitle = document.getElementById('thoughtTitle');
        this.thoughtDate = document.getElementById('thoughtDate');
        this.thoughtCategory = document.getElementById('thoughtCategory');
        this.thoughtContent = document.getElementById('thoughtContent');
        this.insightButton = document.getElementById('insightButton');
        this.insightContainer = document.getElementById('insightContainer');
        this.insightText = document.getElementById('insightText');

        // DOM Elements - Remind Me Feature
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
        
        // Check online status
        this.checkOnlineStatus();
        
        // Set up PWA installation
        this.setupPWAInstall();
        
        // Initialize premium features
        this.initPremiumFeatures();
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
        this.insightButton.addEventListener('click', () => this.generateInsight());
        
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
        // Get values from form
        const title = this.thoughtTitleInput.value.trim() || 'Untitled Thought';
        const category = this.thoughtCategorySelect.value;
        const content = this.transcript.trim();
        const timestamp = new Date().toISOString();
        
        // Create thought object
        const thought = {
            id: 'thought_' + Date.now(),
            title,
            category,
            content,
            timestamp,
            created: new Date().toISOString()
        };
        
        // Save to storage
        this.storage.saveThought(thought);
        
        // Update UI
        this.loadData();
        
        // Hide modal
        this.recordingModal.classList.add('hidden');
        
        // Reset transcript
        this.transcript = '';
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
        // Create thought card
        const thoughtCard = document.createElement('div');
        thoughtCard.className = 'thought-card';
        thoughtCard.setAttribute('data-id', thought.id);
        
        // Format date
        const date = new Date(thought.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
        });
        
        // Get room color
        let roomColor = '';
        if (thought.category === 'personal-growth') {
            roomColor = '#61a67c';
        } else if (thought.category === 'business-ideas') {
            roomColor = '#e6be8a';
        } else if (thought.category === 'dreams-visions') {
            roomColor = '#b798e0';
        } else if (thought.category === 'relationships') {
            roomColor = '#e4b5b5';
        } else if (thought.category === 'creativity') {
            roomColor = '#7bbfcf';
        } else {
            // Find custom room color
            const customRoom = this.customRooms.find(room => room.id === thought.category);
            roomColor = customRoom ? customRoom.color : '#7bbfcf';
        }
        
        // Get room name
        let roomName = this.formatRoomName(thought.category);
        
        // Limit content length
        const contentPreview = thought.content.length > 60 ? 
            thought.content.substring(0, 60) + '...' : thought.content;
        
        // Set card content
        thoughtCard.innerHTML = `
            <h3>${thought.title}</h3>
            <p>${contentPreview}</p>
            <div class="thought-card-footer">
                <span class="thought-date">${formattedDate}</span>
                <span class="thought-room" style="background-color: ${roomColor}">${roomName}</span>
            </div>
        `;
        
        // Add click event
        thoughtCard.addEventListener('click', () => {
            this.openThoughtModal(thought);
        });
        
        return thoughtCard;
    }
    
    openThoughtModal(thought) {
        this.currentThought = thought;
        
        // Set modal content
        this.thoughtTitle.textContent = thought.title;
        this.thoughtContent.textContent = thought.content;
        
        // Format date
        const date = new Date(thought.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        this.thoughtDate.textContent = formattedDate;
        
        // Set room tag
        let roomName = this.formatRoomName(thought.category);
        this.randomMemoryRoom.textContent = roomName;
        
        // Set room color
        let roomColor = '';
        if (thought.category === 'personal-growth') {
            roomColor = '#61a67c';
        } else if (thought.category === 'business-ideas') {
            roomColor = '#e6be8a';
        } else if (thought.category === 'dreams-visions') {
            roomColor = '#b798e0';
        } else if (thought.category === 'relationships') {
            roomColor = '#e4b5b5';
        } else if (thought.category === 'creativity') {
            roomColor = '#7bbfcf';
        } else {
            // Find custom room color
            const customRoom = this.customRooms.find(room => room.id === thought.category);
            roomColor = customRoom ? customRoom.color : '#7bbfcf';
        }
        
        this.randomMemoryRoom.style.backgroundColor = roomColor;
        
        // Show premium feature button for business ideas
        const premiumFeatureContainer = document.getElementById('premiumFeatureContainer');
        if (thought.category === 'business-ideas') {
            premiumFeatureContainer.classList.remove('hidden');
        } else {
            premiumFeatureContainer.classList.add('hidden');
        }
        
        // Show modal
        this.randomMemoryModal.classList.remove('hidden');
    }
    
    closeThoughtModal() {
        this.randomMemoryModal.classList.add('hidden');
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
        this.insightText.textContent = insight;
        this.insightContainer.classList.remove('hidden');
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
}

class MindCastleStorage {
    constructor() {
        this.thoughtsStorageKey = 'mindcastle_thoughts';
        this.customRoomsStorageKey = 'mindcastle_custom_rooms';
        this.thoughtsCache = null;
        this.customRoomsCache = null;
        
        // Initialize thought storage if empty
        if (!localStorage.getItem(this.thoughtsStorageKey)) {
            localStorage.setItem(this.thoughtsStorageKey, JSON.stringify([]));
        }
        
        // Initialize custom room storage if empty
        if (!localStorage.getItem(this.customRoomsStorageKey)) {
            localStorage.setItem(this.customRoomsStorageKey, JSON.stringify([]));
        }
    }
    
    // Thoughts Methods
    getAllThoughts() {
        if (this.thoughtsCache) return this.thoughtsCache;
        
        try {
            const thoughts = JSON.parse(localStorage.getItem(this.thoughtsStorageKey) || '[]');
            this.thoughtsCache = thoughts;
            return thoughts;
        } catch (error) {
            console.error('Error reading thoughts from localStorage:', error);
            return [];
        }
    }
    
    saveThought(thought) {
        const thoughts = this.getAllThoughts();
        thoughts.push(thought);
        
        try {
            localStorage.setItem(this.thoughtsStorageKey, JSON.stringify(thoughts));
            this.thoughtsCache = thoughts;
            return true;
        } catch (error) {
            console.error('Error saving thought to localStorage:', error);
            return false;
        }
    }
    
    getThoughtById(id) {
        const thoughts = this.getAllThoughts();
        return thoughts.find(thought => thought.id === id);
    }
    
    getThoughtsByCategory(category) {
        const thoughts = this.getAllThoughts();
        return thoughts
            .filter(thought => thought.category === category)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    searchThoughts(query) {
        const thoughts = this.getAllThoughts();
        
        return thoughts.filter(thought => {
            const lowerQuery = query.toLowerCase();
            return (
                thought.title.toLowerCase().includes(lowerQuery) ||
                thought.content.toLowerCase().includes(lowerQuery) ||
                thought.category.toLowerCase().includes(lowerQuery)
            );
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    deleteThought(id) {
        let thoughts = this.getAllThoughts();
        thoughts = thoughts.filter(thought => thought.id !== id);
        
        try {
            localStorage.setItem(this.thoughtsStorageKey, JSON.stringify(thoughts));
            this.thoughtsCache = thoughts;
            return true;
        } catch (error) {
            console.error('Error deleting thought from localStorage:', error);
            return false;
        }
    }
    
    // Custom Room Methods
    getCustomRooms() {
        if (this.customRoomsCache) return this.customRoomsCache;
        
        try {
            const rooms = JSON.parse(localStorage.getItem(this.customRoomsStorageKey) || '[]');
            this.customRoomsCache = rooms;
            return rooms;
        } catch (error) {
            console.error('Error reading custom rooms from localStorage:', error);
            return [];
        }
    }
    
    saveCustomRoom(room) {
        const rooms = this.getCustomRooms();
        rooms.push(room);
        
        try {
            localStorage.setItem(this.customRoomsStorageKey, JSON.stringify(rooms));
            this.customRoomsCache = rooms;
            return true;
        } catch (error) {
            console.error('Error saving custom room to localStorage:', error);
            return false;
        }
    }
    
    deleteCustomRoom(id) {
        let rooms = this.getCustomRooms();
        rooms = rooms.filter(room => room.id !== id);
        
        try {
            localStorage.setItem(this.customRoomsStorageKey, JSON.stringify(rooms));
            this.customRoomsCache = rooms;
            return true;
        } catch (error) {
            console.error('Error deleting custom room from localStorage:', error);
            return false;
        }
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