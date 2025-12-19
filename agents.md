# Agent Instructions: Marketing and Ad Preferences Research

This document serves as a guide for the Gemini code builder and other agents working on the AdMe project. It outlines the research focus and implementation guidelines regarding user preferences for marketing and advertisements.

## Research Focus: How Users Prefer Their Marketing and Ads

### Objective
To build the AdMe platform with a deep understanding of user preferences, ensuring that ad delivery is effective yet respectful of the user experience.

### 1. Delivery Mechanisms
*   **Feed-based Ads:** transformative approaches to mixing ads with content.
*   **Non-Intrusive Formats:** Research formats that do not disrupt the user flow (e.g., native ads, sponsored content) versus those that do (pop-ups, interstitials).
*   **User Control:** Explore features that allow users to curate their ad experience (e.g., topic selection, frequency caps).

### 2. User Psychology & Engagement
*   **Value Exchange:** Investigate models where users feel they receive value (content, rewards, utility) in exchange for viewing ads.
*   **Trust & Privacy:** How transparency in data usage affects user willingness to engage with ads.
*   **Ad Blindness:** Strategies to overcome banner blindness without resorting to annoyance.

### 3. Implementation Principals for Gemini Code Builder
*   **UX First:** When generating UI/UX code, prioritize designs that minimize friction.
*   **Data-Driven:** Ensure the architecture supports A/B testing and detailed analytics to measure engagement with different ad types.
*   **Performance:** Ad loading should not degrade the application's performance.

### 4. Technical Requirements
*   Create flexible components that can easily switch between different ad rendering styles.
*   Implement robust logging for user interactions with ad elements (view time, clicks, dismissals).

## Directives
*   **Analyze** existing successful platforms (e.g., Instagram, TikTok, Pinterest) for their ad integration strategies.
*   **Propose** innovative ad formats that leverage the specific context of the AdMe application.
*   **Document** all findings and architectural decisions related to ad delivery.
