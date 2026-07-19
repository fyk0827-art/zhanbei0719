package com.qacollector.config;

import java.util.List;

/**
 * Bipolar feeling-scale bank (20 items). A = left pole, B = right pole.
 * description = chapter label shown above the stem.
 */
public final class FeelingScaleSeedData {

    private FeelingScaleSeedData() {}

    public record Item(String chapter, String title, String left, String right) {}

    public static final List<Item> ITEMS = List.of(
        new Item(
            "I · How you meet the world",
            "When you walk into a new environment, you are usually more like:",
            "Watch the room first, then move closer when it feels right",
            "Start a conversation and get the energy moving"
        ),
        new Item(
            "I · How you meet the world",
            "When someone tells you something complicated, you first catch:",
            "What they are actually feeling",
            "The logic and key points behind it"
        ),
        new Item(
            "I · How you meet the world",
            "When you are unsure about something, you usually:",
            "Turn it over in your mind until you feel sure, then act",
            "Do a little first and find the answer while moving"
        ),
        new Item(
            "I · How you meet the world",
            "You are more used to letting people see you as:",
            "Reliable, steady, someone who doesn't slip up",
            "Interesting, full of ideas, a little different"
        ),
        new Item(
            "I · How you meet the world",
            "You believe something's value comes more from:",
            "Whether it holds up under time, reality, and results",
            "Whether it makes you truly excited and feel alive"
        ),
        new Item(
            "II · Being seen for what you can do",
            "When someone comes to you, you more often:",
            "Listen and hold their feelings with them",
            "Help them sort it out and find the next step"
        ),
        new Item(
            "II · Being seen for what you can do",
            "Facing a messy situation, your first move is more like:",
            "Settle the people and relationships first",
            "Sort out the rules, order, and priorities first"
        ),
        new Item(
            "II · Being seen for what you can do",
            "When you've done a lot but no one notices, you are more like:",
            "Keep doing it well, hoping someone will get it someday",
            "Find a way to make your value visible and clear"
        ),
        new Item(
            "II · Being seen for what you can do",
            "When someone disagrees with you, you are more like:",
            "Wonder first whether you didn't explain it clearly",
            "Check first whether they actually listened and understood"
        ),
        new Item(
            "II · Being seen for what you can do",
            "When you are already exhausted, you are more like:",
            "Finish the work first; your feelings can wait",
            "Admit you can't hold it and leave yourself some space"
        ),
        new Item(
            "III · Work and worth",
            "For you, a good job feels more like:",
            "Stable rules and predictable security",
            "Enough room to make something that is yours"
        ),
        new Item(
            "III · Work and worth",
            "When you set a price for yourself, you more easily:",
            "Worry others will find it expensive and refuse to pay",
            "Ask what your value and delivery are actually worth"
        ),
        new Item(
            "III · Work and worth",
            "In an environment that no longer fits you, you are more like:",
            "Hold on for now, at least it still feels safe",
            "Rather start over than keep draining yourself"
        ),
        new Item(
            "III · Work and worth",
            "When you want an opportunity, you are more like:",
            "Hoping others notice you first, then choose you",
            "Saying it out loud: I want this chance"
        ),
        new Item(
            "III · Work and worth",
            "When money and relationships collide, you are more like:",
            "Take a small loss yourself rather than make the relationship ugly",
            "Believe the closer you are, the clearer rules and money should be"
        ),
        new Item(
            "IV · Relationships and yourself",
            "When you have a real need, you are more like:",
            "Wondering if saying it will trouble someone else",
            "Believing it has to be spoken for anyone to truly understand you"
        ),
        new Item(
            "IV · Relationships and yourself",
            "When a relationship starts to feel off, you are more like:",
            "Adjust yourself first, hoping things can still improve",
            "Check first whether this relationship is respecting you"
        ),
        new Item(
            "IV · Relationships and yourself",
            "When you feel wronged, you are more like:",
            "Hold it in, afraid saying it will change the mood",
            "Want to say it clearly, even if it feels a bit hard"
        ),
        new Item(
            "IV · Relationships and yourself",
            "When you want to do something truly yours, you are more like:",
            "Settle everyone else's needs first, then yourself",
            "Save yourself a place first, and stop always going last"
        ),
        new Item(
            "IV · Relationships and yourself",
            "When negative feelings show up, you are more like:",
            "Push them down, afraid expressing them means losing control",
            "Let them out, trusting they have a reason of their own"
        )
    );
}
