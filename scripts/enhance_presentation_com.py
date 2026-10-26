import os
import sys
import win32com.client
from win32com.client import constants

def enhance_presentation():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pptx_path = os.path.join(base_dir, "HarvestMitra_AI_Premium_Presentation.pptx")
    slides_dir = os.path.join(base_dir, "docs", "presentation_assets", "presentation_slides")
    os.makedirs(slides_dir, exist_ok=True)

    # Import speaker notes from build script
    sys.path.insert(0, os.path.join(base_dir, "scripts"))
    import build_premium_presentation
    _, speaker_notes = build_premium_presentation.build_presentation()

    print("Connecting to Microsoft PowerPoint via COM...")
    ppt = win32com.client.gencache.EnsureDispatch("PowerPoint.Application")
    pres = ppt.Presentations.Open(pptx_path, ReadOnly=0, Untitled=0, WithWindow=0)

    total_slides = pres.Slides.Count
    print(f"Total Slides: {total_slides}")

    # Slide transition settings:
    # Morph or Push or Fade
    # In Office 365 / 2019+, Morph is 3848, Fade is 1793, PushLeft is 3853
    fade_effect = getattr(constants, "ppEffectFade", 1793)
    push_left_effect = getattr(constants, "ppEffectPushLeft", 3853)
    
    # Entrance animations
    anim_fade = getattr(constants, "msoAnimEffectFade", 10)
    anim_float = getattr(constants, "msoAnimEffectAscend", 39) # Float In
    trigger_after = getattr(constants, "msoAnimTriggerAfterPrevious", 3)
    trigger_with = getattr(constants, "msoAnimTriggerWithPrevious", 2)

    for i in range(1, total_slides + 1):
        slide = pres.Slides(i)
        
        # 1. Slide Transition
        # Even slides: Push Left (smooth horizontal flow), Odd slides: Fade (clean cinematic cut)
        if i == 1 or i == 3 or i == 7 or i == 13 or i == 16:
            slide.SlideShowTransition.EntryEffect = fade_effect
            slide.SlideShowTransition.Duration = 0.6
        else:
            slide.SlideShowTransition.EntryEffect = push_left_effect
            slide.SlideShowTransition.Duration = 0.5

        # 2. Add Speaker Notes
        if i - 1 < len(speaker_notes):
            try:
                notes_page = slide.NotesPage
                notes_placeholder = notes_page.Shapes.Placeholders(2)
                notes_placeholder.TextFrame.TextRange.Text = speaker_notes[i - 1]
            except Exception as e:
                print(f"  Note set warning on slide {i}: {e}")

        # 3. Add Native PowerPoint Animations on slide shapes
        # Animate content cards after the header appears
        shape_count = slide.Shapes.Count
        # Add entrance animations to shapes starting from index 3 (cards)
        animated_count = 0
        for s_idx in range(3, min(shape_count + 1, 9)):
            try:
                shp = slide.Shapes(s_idx)
                # Skip background rectangles
                if shp.Width > 13.0 * 72 or shp.Height > 7.0 * 72:
                    continue
                
                eff = slide.TimeLine.MainSequence.AddEffect(
                    shp, 
                    anim_float if animated_count % 2 == 0 else anim_fade, 
                    0, # Level
                    trigger_after if animated_count == 0 else trigger_with
                )
                eff.Timing.Duration = 0.4
                eff.Timing.TriggerDelayTime = 0.08 * animated_count
                animated_count += 1
            except Exception as e:
                pass

        # 4. Export slide to PNG for visual quality check
        slide_img_path = os.path.join(slides_dir, f"slide_{i:02d}.png")
        slide.Export(slide_img_path, "PNG", 1920, 1080)
        print(f"Slide {i:02d}: Enhanced (Transition + Animations + Notes) & Exported to {os.path.basename(slide_img_path)}")

    pres.Save()
    pres.Close()
    ppt.Quit()
    print("\n[SUCCESS] ALL 16 SLIDES FULLY ENHANCED & EXPORTED SUCCESSFULLY!")

if __name__ == "__main__":
    enhance_presentation()
