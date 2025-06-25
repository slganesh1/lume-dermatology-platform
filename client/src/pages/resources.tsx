import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface ResourceContent {
  title: string;
  content: React.ReactNode;
  imagePath?: string;
}

export default function ResourcesPage() {
  const params = useParams();
  const [location, navigate] = useLocation();
  const [resourceData, setResourceData] = useState<ResourceContent | null>(null);
  
  const careType = params.careType;
  const resourceType = params.resourceType;

  useEffect(() => {
    // Get content based on URL parameters
    const content = getResourceContent(careType, resourceType);
    if (content) {
      setResourceData(content);
    }
  }, [careType, resourceType]);

  // Go back to care hub
  const handleBack = () => {
    navigate("/care-hub");
  };

  if (!resourceData) {
    return (
      <div className="container max-w-3xl mx-auto py-8">
        <PageHeader heading="Resource Not Found" subheading="The requested resource could not be found." />
        <div className="mt-6">
          <Button onClick={handleBack} className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Care Hub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <div className="mb-4">
        <Button variant="outline" onClick={handleBack} className="flex items-center">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Care Hub
        </Button>
      </div>
      
      <PageHeader heading={resourceData.title} subheading={`Learn more about ${careType} care`} />
      
      <div className="mt-8">
        <Card>
          <CardContent className="pt-6">
            {resourceData.imagePath && (
              <div className="mb-6">
                <img
                  src={resourceData.imagePath}
                  alt={resourceData.title}
                  className="w-full h-auto rounded-lg max-h-96 object-cover"
                />
              </div>
            )}
            <div className="prose max-w-none">
              {resourceData.content}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to get content based on parameters
function getResourceContent(careType?: string, resourceType?: string): ResourceContent | null {
  // Default content if not found
  if (!careType || !resourceType) {
    return null;
  }

  const resources: Record<string, Record<string, ResourceContent>> = {
    skin: {
      understanding: {
        title: "Understanding Your Skin Type",
        content: (
          <>
            <h2>Know Your Skin Type</h2>
            <p>
              Understanding your skin type is the foundation of effective skincare. Your skin type is determined by genetics, but can be influenced by external factors and can change over time.
            </p>
            
            <h3>The Main Skin Types</h3>
            <ul>
              <li>
                <strong>Normal Skin:</strong> Well-balanced, not too oily or dry, with good circulation and a healthy complexion.
              </li>
              <li>
                <strong>Dry Skin:</strong> Produces less sebum than normal skin, leading to a lack of moisture and elasticity.
              </li>
              <li>
                <strong>Oily Skin:</strong> Overproduces sebum, leading to a shiny appearance and potential acne issues.
              </li>
              <li>
                <strong>Combination Skin:</strong> Features both oily and dry areas, typically with an oily T-zone (forehead, nose, chin).
              </li>
              <li>
                <strong>Sensitive Skin:</strong> Reacts easily to external factors, with symptoms like redness, itching, or burning.
              </li>
            </ul>
            
            <h3>Identifying Your Skin Type</h3>
            <p>
              <strong>The Bare Face Method:</strong> Cleanse your face and wait an hour without applying any products. Then, observe your skin:
            </p>
            <ul>
              <li>If it feels tight and possibly flaky, you likely have dry skin</li>
              <li>If it's shiny all over, you likely have oily skin</li>
              <li>If only your T-zone is shiny, you likely have combination skin</li>
              <li>If your skin feels comfortable with no extreme characteristics, you likely have normal skin</li>
            </ul>
            
            <h3>Common Skin Concerns</h3>
            <p>
              Beyond skin type, you may have specific concerns that need targeted treatment:
            </p>
            <ul>
              <li>Acne and breakouts</li>
              <li>Hyperpigmentation and dark spots</li>
              <li>Fine lines and wrinkles</li>
              <li>Rosacea and redness</li>
              <li>Dehydration (which can affect any skin type)</li>
            </ul>
            
            <h3>Building Your Skincare Routine</h3>
            <p>
              Once you understand your skin type and concerns, you can build an effective routine with:
            </p>
            <ol>
              <li>Cleanser appropriate for your skin type</li>
              <li>Targeted treatments for specific concerns</li>
              <li>Moisturizer to maintain hydration</li>
              <li>Sunscreen to protect from UV damage</li>
            </ol>
            
            <p>
              Remember that consistency is key, and it's best to introduce new products one at a time to monitor how your skin responds.
            </p>
          </>
        ),
        imagePath: "/img/skin-types-guide.jpg",
      },
      ingredients: {
        title: "Skincare Ingredient Guide",
        content: (
          <>
            <h2>Understanding Skincare Ingredients</h2>
            <p>
              Navigating skincare ingredients can be overwhelming, but understanding the key players will help you choose products that address your specific concerns.
            </p>
            
            <h3>Key Ingredients for Common Concerns</h3>
            
            <h4>For Acne and Breakouts</h4>
            <ul>
              <li>
                <strong>Salicylic Acid:</strong> A beta-hydroxy acid (BHA) that exfoliates inside pores to clear blockages
              </li>
              <li>
                <strong>Benzoyl Peroxide:</strong> Kills acne-causing bacteria and removes excess oil
              </li>
              <li>
                <strong>Niacinamide:</strong> Reduces inflammation and regulates sebum production
              </li>
              <li>
                <strong>Tea Tree Oil:</strong> Natural antibacterial properties that help fight acne
              </li>
            </ul>
            
            <h4>For Hyperpigmentation and Dark Spots</h4>
            <ul>
              <li>
                <strong>Vitamin C:</strong> Brightens skin and inhibits melanin production
              </li>
              <li>
                <strong>Alpha Arbutin:</strong> Blocks tyrosinase to prevent melanin formation
              </li>
              <li>
                <strong>Kojic Acid:</strong> Derived from mushrooms, helps brighten skin
              </li>
              <li>
                <strong>Tranexamic Acid:</strong> Reduces melanin production and inflammation
              </li>
            </ul>
            
            <h4>For Anti-Aging</h4>
            <ul>
              <li>
                <strong>Retinol/Retinoids:</strong> Vitamin A derivatives that boost collagen and increase cell turnover
              </li>
              <li>
                <strong>Peptides:</strong> Amino acid chains that signal collagen production
              </li>
              <li>
                <strong>Hyaluronic Acid:</strong> Holds water to plump and hydrate skin
              </li>
              <li>
                <strong>Antioxidants:</strong> Fight free radical damage (e.g., vitamin C, vitamin E, resveratrol, green tea)
              </li>
            </ul>
            
            <h4>For Sensitive Skin and Redness</h4>
            <ul>
              <li>
                <strong>Centella Asiatica:</strong> Also known as Cica or Tiger Grass, soothes inflammation
              </li>
              <li>
                <strong>Aloe Vera:</strong> Cooling and calming for irritated skin
              </li>
              <li>
                <strong>Oatmeal:</strong> Anti-inflammatory and helps maintain skin barrier
              </li>
              <li>
                <strong>Allantoin:</strong> Soothes and protects while promoting cell regeneration
              </li>
            </ul>
            
            <h3>Ingredients to Approach with Caution</h3>
            <p>
              Some powerful ingredients should be used carefully, with proper introduction to your skincare routine:
            </p>
            <ul>
              <li>
                <strong>Alpha Hydroxy Acids (AHAs):</strong> Glycolic acid, lactic acid, etc. Start with lower concentrations
              </li>
              <li>
                <strong>Retinoids:</strong> Begin with lower strengths and use just 1-2 times per week initially
              </li>
              <li>
                <strong>Vitamin C:</strong> Some formulations can be irritating; start with lower concentrations
              </li>
              <li>
                <strong>Essential Oils:</strong> Can cause sensitization in some people
              </li>
            </ul>
            
            <h3>Building a Routine with Active Ingredients</h3>
            <p>
              When incorporating active ingredients:
            </p>
            <ol>
              <li>Introduce one new active at a time</li>
              <li>Give your skin time to adjust (2-4 weeks)</li>
              <li>Consider potential interactions between ingredients</li>
              <li>Use sun protection during the day, especially with AHAs, BHAs, and retinoids</li>
            </ol>
            
            <p>
              Remember that more isn't always better. A focused routine with a few well-chosen actives is often more effective than layering many products.
            </p>
          </>
        ),
        imagePath: "/img/skincare-ingredients.jpg",
      },
      tips: {
        title: "Seasonal Skincare Tips",
        content: (
          <>
            <h2>Adapting Your Skincare Routine for Every Season</h2>
            <p>
              Just as you change your wardrobe with the seasons, your skincare routine should adapt to changing environmental conditions. Here's how to adjust your regimen throughout the year.
            </p>
            
            <h3>Spring Skincare</h3>
            <p>
              As temperatures rise and humidity increases:
            </p>
            <ul>
              <li>Switch to a lighter moisturizer if you used a heavier one in winter</li>
              <li>Incorporate gentle exfoliation to remove winter's dead skin buildup</li>
              <li>Increase antioxidant protection as UV exposure increases</li>
              <li>Ensure your sunscreen is broad-spectrum and at least SPF 30</li>
              <li>Consider adding a vitamin C serum if you don't already use one</li>
            </ul>
            
            <h3>Summer Skincare</h3>
            <p>
              During hot, humid months:
            </p>
            <ul>
              <li>Use lighter, oil-free moisturizers and gel formulations</li>
              <li>Apply (and reapply) broad-spectrum sunscreen religiously</li>
              <li>Consider using a separate antioxidant serum for added environmental protection</li>
              <li>Cleanse more thoroughly if you're sweating more or wearing more sunscreen</li>
              <li>Store certain products (like sheet masks or aloe gel) in the refrigerator for a cooling effect</li>
            </ul>
            
            <h3>Fall Skincare</h3>
            <p>
              As weather becomes cooler and drier:
            </p>
            <ul>
              <li>Transition to a more hydrating cleanser</li>
              <li>Reintroduce richer moisturizers as needed</li>
              <li>Consider adding hyaluronic acid serums to maintain hydration</li>
              <li>Continue sun protection—UV rays are present year-round</li>
              <li>Fall is a good time to reintroduce retinoids if you reduced use during summer</li>
            </ul>
            
            <h3>Winter Skincare</h3>
            <p>
              In cold, dry conditions:
            </p>
            <ul>
              <li>Use gentle, non-foaming cleansers to avoid stripping natural oils</li>
              <li>Incorporate thicker, more emollient moisturizers</li>
              <li>Consider adding a facial oil for an extra barrier against the elements</li>
              <li>Continue using sunscreen, especially if you're around snow (which reflects UV)</li>
              <li>Humidifiers can help maintain environmental moisture</li>
              <li>Reduce frequency of potential irritants like strong acids or retinoids if your skin becomes more sensitive</li>
            </ul>
            
            <h3>Year-Round Essentials</h3>
            <p>
              Regardless of season, always maintain:
            </p>
            <ol>
              <li>Proper cleansing suitable for your skin type</li>
              <li>Sun protection (minimum SPF 30)</li>
              <li>Adequate hydration</li>
              <li>Consistency with your core routine</li>
            </ol>
            
            <h3>Special Considerations</h3>
            <p>
              Remember that seasonal changes may also trigger specific skin concerns:
            </p>
            <ul>
              <li>Allergies in spring can cause skin sensitivity</li>
              <li>Heat and humidity in summer can trigger breakouts</li>
              <li>Temperature fluctuations in fall can cause redness</li>
              <li>Indoor heating in winter can severely dehydrate skin</li>
            </ul>
            
            <p>
              Listen to your skin and be willing to adjust your routine as needed. What works in one season may not be ideal in another.
            </p>
          </>
        ),
        imagePath: "/img/seasonal-skincare.jpg",
      },
    },
    hair: {
      understanding: {
        title: "Understanding Your Hair Type",
        content: (
          <>
            <h2>Understanding Hair Types and Characteristics</h2>
            <p>
              Knowing your hair type is essential for selecting the right products and styling techniques. Hair classification typically considers several factors: texture, porosity, density, and thickness.
            </p>
            
            <h3>Hair Texture Classification</h3>
            <p>
              Hair texture is commonly classified using a numerical system:
            </p>
            <ul>
              <li>
                <strong>Type 1: Straight Hair</strong>
                <ul>
                  <li>1A: Fine, very straight, often shiny</li>
                  <li>1B: Medium texture with slight bend</li>
                  <li>1C: Thick, coarse with more resistance to styling</li>
                </ul>
              </li>
              <li>
                <strong>Type 2: Wavy Hair</strong>
                <ul>
                  <li>2A: Fine, barely-there "S" pattern</li>
                  <li>2B: Medium texture with more defined waves</li>
                  <li>2C: Thick with well-defined S-shaped curls</li>
                </ul>
              </li>
              <li>
                <strong>Type 3: Curly Hair</strong>
                <ul>
                  <li>3A: Loose, springy curls with shiny appearance</li>
                  <li>3B: Springy, tight curls with more volume</li>
                  <li>3C: Very tight corkscrew curls, densely packed</li>
                </ul>
              </li>
              <li>
                <strong>Type 4: Coily/Kinky Hair</strong>
                <ul>
                  <li>4A: Tightly coiled S-pattern with good definition</li>
                  <li>4B: Less defined pattern with sharp angles like the letter "Z"</li>
                  <li>4C: Extremely tight coils with less definition, very delicate</li>
                </ul>
              </li>
            </ul>
            
            <h3>Hair Porosity</h3>
            <p>
              Porosity refers to your hair's ability to absorb and retain moisture:
            </p>
            <ul>
              <li>
                <strong>Low Porosity:</strong> Cuticles lie flat and tight, making it difficult for moisture to penetrate. Product tends to sit on hair rather than absorb.
              </li>
              <li>
                <strong>Medium Porosity:</strong> Balanced moisture absorption and retention. Requires less maintenance.
              </li>
              <li>
                <strong>High Porosity:</strong> Cuticles are raised and gaps allow moisture to enter easily but also escape quickly. Hair may feel dry despite frequent conditioning.
              </li>
            </ul>
            
            <h3>Hair Density</h3>
            <p>
              Density refers to how many individual hairs you have per square inch on your scalp:
            </p>
            <ul>
              <li>
                <strong>Low Density:</strong> You can easily see your scalp without manipulating your hair
              </li>
              <li>
                <strong>Medium Density:</strong> Some scalp visible, but generally appears full
              </li>
              <li>
                <strong>High Density:</strong> Difficult to see scalp even when trying to part hair
              </li>
            </ul>
            
            <h3>Hair Thickness/Width</h3>
            <p>
              This refers to the diameter of individual hair strands:
            </p>
            <ul>
              <li>
                <strong>Fine:</strong> Each strand is thin, hair tends to fall flat, breaks easily
              </li>
              <li>
                <strong>Medium:</strong> Average thickness, versatile with styling
              </li>
              <li>
                <strong>Coarse:</strong> Each strand is thick, hair may resist styling, usually very strong
              </li>
            </ul>
            
            <h3>Common Hair Concerns</h3>
            <p>
              Different hair types often experience specific challenges:
            </p>
            <ul>
              <li>Straight hair: Oiliness, lack of volume</li>
              <li>Wavy hair: Inconsistent pattern, frizz</li>
              <li>Curly hair: Dryness, frizz, tangling</li>
              <li>Coily hair: Severe dryness, breakage, shrinkage</li>
            </ul>
            
            <h3>Building Your Hair Care Routine</h3>
            <p>
              Once you understand your hair type and characteristics, you can build a personalized routine:
            </p>
            <ol>
              <li>Select shampoo and conditioner formulated for your hair type</li>
              <li>Consider your hair's porosity when choosing styling products</li>
              <li>Adjust washing frequency based on scalp needs</li>
              <li>Use styling techniques that enhance your natural pattern</li>
              <li>Choose tools appropriate for your hair's density and thickness</li>
            </ol>
            
            <p>
              Remember that hair needs can change with seasons, age, hormonal fluctuations, and treatments, so be prepared to adjust your approach when necessary.
            </p>
          </>
        ),
        imagePath: "/img/hair-types-guide.jpg",
      },
      ingredients: {
        title: "Hair Care Myths",
        content: (
          <>
            <h2>Debunking Common Hair Care Myths</h2>
            <p>
              The world of hair care is filled with myths and misconceptions that can lead to ineffective or even harmful practices. Let's separate fact from fiction.
            </p>
            
            <h3>Myth 1: Frequent trimming makes hair grow faster</h3>
            <p>
              <strong>Fact:</strong> Hair grows from the roots, not the ends. Trimming has no effect on growth rate, which is determined by genetics and health. However, regular trims do prevent split ends from traveling up the hair shaft, keeping hair looking healthier as it grows.
            </p>
            
            <h3>Myth 2: Brushing hair 100 strokes daily is good for it</h3>
            <p>
              <strong>Fact:</strong> Excessive brushing creates friction that can damage hair cuticles and cause breakage. Gentle brushing to detangle is sufficient—just enough to distribute natural oils from scalp to ends.
            </p>
            
            <h3>Myth 3: Switching shampoos prevents "getting used to" products</h3>
            <p>
              <strong>Fact:</strong> Hair doesn't develop "immunity" to shampoo. However, product buildup or seasonal changes in your hair needs might make it seem like products stop working. A clarifying shampoo once monthly can help remove buildup.
            </p>
            
            <h3>Myth 4: Plucking one gray hair causes more to grow back</h3>
            <p>
              <strong>Fact:</strong> Each hair follicle operates independently. Plucking a gray hair doesn't affect neighboring follicles. However, plucking can damage follicles over time and lead to thinning.
            </p>
            
            <h3>Myth 5: Natural oils are always better than silicones</h3>
            <p>
              <strong>Fact:</strong> Both have their place. Natural oils provide nourishment, while silicones offer protection against heat and environmental damage. Quality silicones that are water-soluble won't cause buildup when properly cleansed.
            </p>
            
            <h3>Myth 6: You can repair split ends with products</h3>
            <p>
              <strong>Fact:</strong> Once a hair strand splits, it cannot be permanently repaired. Products can temporarily "glue" splits together for cosmetic improvement, but trimming is the only true solution.
            </p>
            
            <h3>Myth 7: Cold water makes hair shinier</h3>
            <p>
              <strong>Fact:</strong> A cool rinse can help close the cuticle and create more reflection, but the effect is minimal and temporary. Shine primarily comes from hair health, products used, and cuticle condition.
            </p>
            
            <h3>Myth 8: Hair can become "addicted" to conditioner</h3>
            <p>
              <strong>Fact:</strong> Hair is dead keratin and cannot become dependent on products. Using conditioner consistently keeps hair moisturized and protected, but stopping won't damage your hair beyond normal dryness.
            </p>
            
            <h3>Myth 9: Air-drying is always healthier than heat styling</h3>
            <p>
              <strong>Fact:</strong> While excessive heat can damage hair, leaving hair wet for extended periods can actually cause swelling and damage to the hair shaft. A balance of gentle, controlled heat with proper protection is often best.
            </p>
            
            <h3>Myth 10: Dandruff means your scalp is dry</h3>
            <p>
              <strong>Fact:</strong> Dandruff is usually caused by a fungal imbalance on an oily scalp, not dryness. Using moisturizing products can worsen the condition. Specialized anti-dandruff shampoos target the underlying fungal issue.
            </p>
            
            <h3>Evidence-Based Hair Care Approach</h3>
            <p>
              For truly healthy hair, focus on:
            </p>
            <ul>
              <li>Gentle cleansing appropriate for your scalp type</li>
              <li>Regular conditioning focused on the lengths and ends</li>
              <li>Protection from heat, sun, and environmental stressors</li>
              <li>Minimal tension when styling to prevent traction damage</li>
              <li>A nutrient-rich diet that supports hair growth</li>
            </ul>
            
            <p>
              Remember that individual hair needs vary greatly. What works for someone else may not work for you, even with similar hair types.
            </p>
          </>
        ),
        imagePath: "/img/hair-myths.jpg",
      },
      tips: {
        title: "Healthy Hair Diet",
        content: (
          <>
            <h2>Nutrition for Healthy Hair Growth</h2>
            <p>
              While external hair care is important, the foundation of beautiful hair begins with what you eat. Hair is primarily made of protein and requires adequate nutrients to grow strong and maintain its health.
            </p>
            
            <h3>Essential Nutrients for Hair Health</h3>
            
            <h4>Proteins</h4>
            <p>
              Hair is approximately 95% keratin, a tough protein that forms the hair shaft.
            </p>
            <ul>
              <li>
                <strong>Food sources:</strong> Eggs, lean meats, fish, dairy, legumes, nuts, seeds
              </li>
              <li>
                <strong>Benefits:</strong> Provides the building blocks for hair growth
              </li>
              <li>
                <strong>Deficiency signs:</strong> Brittle hair, slowed growth, hair loss
              </li>
            </ul>
            
            <h4>Iron</h4>
            <p>
              Iron helps red blood cells carry oxygen to your hair follicles.
            </p>
            <ul>
              <li>
                <strong>Food sources:</strong> Red meat, spinach, lentils, fortified cereals, oysters
              </li>
              <li>
                <strong>Benefits:</strong> Ensures proper oxygenation of follicles
              </li>
              <li>
                <strong>Deficiency signs:</strong> Hair loss, especially in women
              </li>
            </ul>
            
            <h4>Omega-3 Fatty Acids</h4>
            <p>
              These healthy fats nourish hair follicles and support scalp health.
            </p>
            <ul>
              <li>
                <strong>Food sources:</strong> Fatty fish (salmon, mackerel), flaxseeds, walnuts, chia seeds
              </li>
              <li>
                <strong>Benefits:</strong> Reduces inflammation, adds shine, prevents dryness
              </li>
              <li>
                <strong>Deficiency signs:</strong> Dry, dull hair and scalp
              </li>
            </ul>
            
            <h4>Vitamin E</h4>
            <p>
              A powerful antioxidant that helps protect hair from oxidative stress.
            </p>
            <ul>
              <li>
                <strong>Food sources:</strong> Almonds, sunflower seeds, spinach, avocados
              </li>
              <li>
                <strong>Benefits:</strong> Protects hair cells from damage, improves circulation
              </li>
              <li>
                <strong>Deficiency signs:</strong> Decreased shine, increased breakage
              </li>
            </ul>
            
            <h4>Vitamin A</h4>
            <p>
              Helps produce sebum, the natural oil that moisturizes your scalp.
            </p>
            <ul>
              <li>
                <strong>Food sources:</strong> Sweet potatoes, carrots, spinach, kale, egg yolks
              </li>
              <li>
                <strong>Benefits:</strong> Maintains scalp moisture, supports cell growth
              </li>
              <li>
                <strong>Balance note:</strong> Too much can actually trigger hair loss, so focus on food sources rather than supplements
              </li>
            </ul>
            
            <h4>B Vitamins (Especially Biotin)</h4>
            <p>
              Essential for energy production in hair follicles and keratin infrastructure.
            </p>
            <ul>
              <li>
                <strong>Food sources:</strong> Eggs, fish, meat, leafy greens, whole grains, nuts
              </li>
              <li>
                <strong>Benefits:</strong> Strengthens hair structure, promotes growth
              </li>
              <li>
                <strong>Deficiency signs:</strong> Hair loss, premature graying
              </li>
            </ul>
            
            <h4>Vitamin C</h4>
            <p>
              Helps your body absorb iron and produce collagen.
            </p>
            <ul>
              <li>
                <strong>Food sources:</strong> Citrus fruits, strawberries, bell peppers, broccoli
              </li>
              <li>
                <strong>Benefits:</strong> Strengthens hair shaft, prevents breakage
              </li>
              <li>
                <strong>Deficiency signs:</strong> Dry, splitting hair
              </li>
            </ul>
            
            <h4>Zinc and Selenium</h4>
            <p>
              Minerals that support hair tissue growth and repair.
            </p>
            <ul>
              <li>
                <strong>Food sources:</strong> Oysters, beef, pumpkin seeds, lentils, brazil nuts
              </li>
              <li>
                <strong>Benefits:</strong> Supports hair growth cycle, prevents dandruff
              </li>
              <li>
                <strong>Deficiency signs:</strong> Hair loss, scalp issues
              </li>
            </ul>
            
            <h3>Hydration and Hair Health</h3>
            <p>
              Adequate water intake is crucial for:
            </p>
            <ul>
              <li>Delivering nutrients to hair follicles</li>
              <li>Maintaining scalp health</li>
              <li>Supporting overall hair hydration</li>
            </ul>
            <p>
              Aim for at least 8 glasses of water daily.
            </p>
            
            <h3>Sample Hair-Healthy Daily Menu</h3>
            <p>
              <strong>Breakfast:</strong> Spinach and mushroom omelet with a side of berries<br />
              <strong>Snack:</strong> Handful of walnuts and sunflower seeds<br />
              <strong>Lunch:</strong> Grilled salmon with quinoa and steamed broccoli<br />
              <strong>Snack:</strong> Greek yogurt with flaxseeds<br />
              <strong>Dinner:</strong> Lentil soup with dark leafy greens and a sweet potato
            </p>
            
            <h3>Lifestyle Factors That Impact Hair Nutrition</h3>
            <p>
              Beyond diet, be mindful of:
            </p>
            <ul>
              <li>
                <strong>Stress management:</strong> Chronic stress diverts nutrients away from hair
              </li>
              <li>
                <strong>Sleep quality:</strong> Hair growth happens during rest periods
              </li>
              <li>
                <strong>Smoking:</strong> Reduces blood flow to follicles
              </li>
              <li>
                <strong>Alcohol consumption:</strong> Can deplete key hair nutrients
              </li>
            </ul>
            
            <p>
              Remember that hair has a long growth cycle (typically 3-5 years), so nutritional changes may take several months to show visible results.
            </p>
          </>
        ),
        imagePath: "/img/hair-nutrition.jpg",
      },
    },
    antiaging: {
      understanding: {
        title: "Understanding the Aging Process",
        content: (
          <>
            <h2>The Science of Skin Aging</h2>
            <p>
              Skin aging is influenced by both internal (intrinsic) and external (extrinsic) factors. Understanding these processes helps in developing effective anti-aging strategies.
            </p>
            
            <h3>Intrinsic Aging: The Natural Timeline</h3>
            <p>
              Intrinsic aging is the natural, genetically determined process that occurs regardless of external influences:
            </p>
            <ul>
              <li>
                <strong>Collagen and Elastin Decline:</strong> After age 20, we produce approximately 1% less collagen each year. This structural protein is responsible for skin firmness.
              </li>
              <li>
                <strong>Slower Cell Turnover:</strong> Young skin regenerates every 28-30 days; by age 40, this cycle slows to 40-60 days, leading to duller appearance.
              </li>
              <li>
                <strong>Reduced Oil Production:</strong> Sebaceous glands become less active with age, resulting in drier skin.
              </li>
              <li>
                <strong>Fat Redistribution:</strong> Subcutaneous fat diminishes in some areas (like the face) while potentially increasing in others.
              </li>
              <li>
                <strong>Bone Resorption:</strong> Facial bones, particularly around the eye and jaw, gradually lose volume, affecting facial structure.
              </li>
            </ul>
            
            <h3>Extrinsic Aging: Environmental Influences</h3>
            <p>
              External factors can accelerate the aging process by as much as 80%:
            </p>
            <ul>
              <li>
                <strong>UV Exposure (Photoaging):</strong> Accounts for approximately 80-90% of visible aging signs. UV rays generate free radicals that damage skin cells and break down collagen and elastin.
              </li>
              <li>
                <strong>Pollution:</strong> Particulate matter and chemicals in the air create oxidative stress, triggering inflammation and collagen breakdown.
              </li>
              <li>
                <strong>Smoking:</strong> Restricts blood flow to the skin and contains thousands of chemicals that damage collagen and elastin.
              </li>
              <li>
                <strong>Diet:</strong> High sugar consumption leads to glycation, a process where sugar molecules attach to proteins like collagen, making them rigid and less functional.
              </li>
              <li>
                <strong>Sleep Position:</strong> Regular pressure on the face from side or stomach sleeping can create "sleep wrinkles" over time.
              </li>
              <li>
                <strong>Repetitive Facial Expressions:</strong> Habitual expressions eventually form permanent lines in areas of frequent muscle movement.
              </li>
            </ul>
            
            <h3>Cellular Level Changes</h3>
            <p>
              At the cellular level, aging involves several key processes:
            </p>
            <ul>
              <li>
                <strong>Oxidative Stress:</strong> Free radicals damage cell structures, including DNA, leading to premature aging and potentially skin cancers.
              </li>
              <li>
                <strong>Glycation:</strong> Sugar molecules bind to proteins, creating advanced glycation end products (AGEs) that stiffen collagen fibers.
              </li>
              <li>
                <strong>Telomere Shortening:</strong> These protective caps on chromosomes shorten with each cell division, eventually limiting cell replication.
              </li>
              <li>
                <strong>Mitochondrial Dysfunction:</strong> The cell's energy factories become less efficient, reducing overall cellular function.
              </li>
              <li>
                <strong>Inflammation:</strong> Chronic, low-grade inflammation ("inflammaging") accelerates aging processes.
              </li>
            </ul>
            
            <h3>The Timeline of Visible Aging Signs</h3>
            <p>
              Understanding when different aging signs typically appear can help with targeted prevention:
            </p>
            <ul>
              <li>
                <strong>20s:</strong> Early expression lines, slight dullness
              </li>
              <li>
                <strong>30s:</strong> Fine lines, decreased glow, early volume loss
              </li>
              <li>
                <strong>40s:</strong> Deeper wrinkles, noticeable elasticity loss, uneven pigmentation
              </li>
              <li>
                <strong>50s:</strong> Significant volume loss, dryness, structural changes
              </li>
              <li>
                <strong>60s+:</strong> Further laxity, deeper wrinkles, more pronounced bone loss
              </li>
            </ul>
            
            <h3>Comprehensive Anti-Aging Approach</h3>
            <p>
              Effective anti-aging strategies address multiple aspects of aging:
            </p>
            <ol>
              <li>Sun protection (the single most effective anti-aging measure)</li>
              <li>Antioxidant use to combat free radical damage</li>
              <li>Collagen-stimulating ingredients (retinoids, peptides)</li>
              <li>Exfoliation to improve cell turnover</li>
              <li>Hydration to maintain skin barrier function</li>
              <li>Anti-inflammatory lifestyle (diet, stress management, sleep)</li>
            </ol>
            
            <p>
              Remember that aging is a natural process. The goal should be to support healthy aging rather than fighting against natural changes.
            </p>
          </>
        ),
        imagePath: "/img/skin-aging-process.jpg",
      },
      ingredients: {
        title: "Anti-Aging Ingredients",
        content: (
          <>
            <h2>Evidence-Based Anti-Aging Ingredients</h2>
            <p>
              When navigating the vast world of anti-aging skincare, it's important to focus on ingredients with scientific backing. Here's a comprehensive guide to clinically-proven anti-aging ingredients and how they work.
            </p>
            
            <h3>Gold Standard Anti-Aging Ingredients</h3>
            
            <h4>Retinoids</h4>
            <p>
              Vitamin A derivatives remain the most thoroughly researched and effective anti-aging ingredients.
            </p>
            <ul>
              <li>
                <strong>How they work:</strong> Increase cell turnover, stimulate collagen production, reduce fine lines, improve texture and pigmentation
              </li>
              <li>
                <strong>Types:</strong> Retinol (over-the-counter), retinaldehyde, adapalene, prescription retinoids (tretinoin, tazarotene)
              </li>
              <li>
                <strong>Usage tips:</strong> Start with low concentrations (0.01-0.03%) 1-2 times weekly, gradually increasing frequency; always use sunscreen
              </li>
              <li>
                <strong>Best for:</strong> Most skin types, particularly effective for photoaging, acne, and fine lines
              </li>
            </ul>
            
            <h4>Vitamin C (L-ascorbic acid)</h4>
            <p>
              A potent antioxidant that brightens and protects skin.
            </p>
            <ul>
              <li>
                <strong>How it works:</strong> Neutralizes free radicals, inhibits melanin production, essential for collagen synthesis
              </li>
              <li>
                <strong>Effective concentration:</strong> 10-20% for L-ascorbic acid
              </li>
              <li>
                <strong>Usage tips:</strong> Use in morning routine beneath sunscreen; look for stabilized formulations with ferulic acid and vitamin E
              </li>
              <li>
                <strong>Best for:</strong> Brightening, protection against environmental damage, improving uneven tone
              </li>
            </ul>
            
            <h4>Peptides</h4>
            <p>
              Short chains of amino acids that signal specific skin functions.
            </p>
            <ul>
              <li>
                <strong>How they work:</strong> Signal cells to produce more collagen, improve barrier function, some mimic botulinum toxin effects
              </li>
              <li>
                <strong>Key types:</strong> Signal peptides, carrier peptides, neurotransmitter-affecting peptides, enzyme-inhibiting peptides
              </li>
              <li>
                <strong>Notable examples:</strong> Matrixyl (palmitoyl pentapeptide-4), Argireline (acetyl hexapeptide-8)
              </li>
              <li>
                <strong>Best for:</strong> Supporting skin structure, complementing other anti-aging ingredients
              </li>
            </ul>
            
            <h4>Niacinamide (Vitamin B3)</h4>
            <p>
              A versatile ingredient with multiple anti-aging benefits.
            </p>
            <ul>
              <li>
                <strong>How it works:</strong> Improves barrier function, reduces hyperpigmentation, minimizes pore appearance, protects from oxidative stress
              </li>
              <li>
                <strong>Effective concentration:</strong> 2-10%
              </li>
              <li>
                <strong>Usage tips:</strong> Well-tolerated by most skin types; can be used twice daily
              </li>
              <li>
                <strong>Best for:</strong> Multiple concerns simultaneously, sensitive skin, rosacea-prone skin
              </li>
            </ul>
            
            <h3>Supporting Anti-Aging Ingredients</h3>
            
            <h4>Alpha Hydroxy Acids (AHAs)</h4>
            <p>
              Exfoliating acids that reveal fresher skin.
            </p>
            <ul>
              <li>
                <strong>How they work:</strong> Dissolve bonds between dead skin cells, stimulate cell turnover, improve texture
              </li>
              <li>
                <strong>Types:</strong> Glycolic acid (smallest molecule, deeper penetration), lactic acid (more hydrating), mandelic acid (gentle)
              </li>
              <li>
                <strong>Effective concentration:</strong> 5-10% for daily use, up to 30% for professional peels
              </li>
              <li>
                <strong>Best for:</strong> Surface texture, dullness, mild hyperpigmentation
              </li>
            </ul>
            
            <h4>Hyaluronic Acid</h4>
            <p>
              A humectant that draws moisture into the skin.
            </p>
            <ul>
              <li>
                <strong>How it works:</strong> Binds up to 1000 times its weight in water, plumps skin, temporarily fills fine lines
              </li>
              <li>
                <strong>Types:</strong> Various molecular weights penetrate different skin layers
              </li>
              <li>
                <strong>Usage tips:</strong> Apply to damp skin, follow with occlusive moisturizer to seal in hydration
              </li>
              <li>
                <strong>Best for:</strong> Dehydrated skin, instant plumping effect
              </li>
            </ul>
            
            <h4>Antioxidants</h4>
            <p>
              Compounds that neutralize free radicals and prevent oxidative damage.
            </p>
            <ul>
              <li>
                <strong>Key types:</strong> Vitamin E (tocopherol), resveratrol, green tea polyphenols, coenzyme Q10, astaxanthin
              </li>
              <li>
                <strong>How they work:</strong> Donate electrons to stabilize free radicals, preventing cellular damage
              </li>
              <li>
                <strong>Usage tips:</strong> Most effective when used in combination; apply in morning for environmental protection
              </li>
              <li>
                <strong>Best for:</strong> Preventative anti-aging, supporting other active ingredients
              </li>
            </ul>
            
            <h4>Growth Factors</h4>
            <p>
              Proteins that regulate cell division and stimulate regeneration.
            </p>
            <ul>
              <li>
                <strong>How they work:</strong> Signal cells to produce collagen and elastin, improve wound healing and regeneration
              </li>
              <li>
                <strong>Sources:</strong> Lab-engineered, human stem cell-derived, plant-based
              </li>
              <li>
                <strong>Best for:</strong> Advanced anti-aging regimens, post-procedure healing
              </li>
            </ul>
            
            <h3>Building an Effective Anti-Aging Regimen</h3>
            <p>
              When combining anti-aging ingredients:
            </p>
            <ol>
              <li>Introduce one active at a time (2-4 weeks apart)</li>
              <li>Consider potential interactions (e.g., separate retinoids and acidic ingredients)</li>
              <li>Layer from thinnest to thickest consistency</li>
              <li>Always include sun protection as the final morning step</li>
              <li>Be patient—most ingredients require 8-12 weeks for visible results</li>
            </ol>
            
            <p>
              Remember that the best anti-aging regimen is consistent, multi-faceted, and tailored to your specific concerns and skin type.
            </p>
          </>
        ),
        imagePath: "/img/antiaging-ingredients.jpg",
      },
      tips: {
        title: "Lifestyle for Aging Well",
        content: (
          <>
            <h2>Lifestyle Habits for Holistic Aging Well</h2>
            <p>
              While skincare products play an important role in managing visible aging, lifestyle factors have profound effects on how we age from the inside out. These evidence-based strategies can help support healthy aging across all body systems, with visible benefits for skin.
            </p>
            
            <h3>Sun Protection: The Foundation of Anti-Aging</h3>
            <p>
              Up to 90% of visible skin aging comes from UV exposure, making this the single most important anti-aging strategy.
            </p>
            <ul>
              <li>Use broad-spectrum SPF 30+ daily, regardless of weather or season</li>
              <li>Reapply every two hours when outdoors</li>
              <li>Supplement with protective clothing, hats, and sunglasses</li>
              <li>Seek shade during peak UV hours (10am-4pm)</li>
              <li>Consider oral photoprotective supplements with polypodium leucotomos or astaxanthin</li>
            </ul>
            
            <h3>Nutrition for Aging Well</h3>
            <p>
              Your diet provides the building blocks for skin regeneration and repair.
            </p>
            <ul>
              <li>
                <strong>Anti-inflammatory eating patterns:</strong> Mediterranean or MIND diet approaches
              </li>
              <li>
                <strong>Antioxidant-rich foods:</strong> Colorful fruits and vegetables, especially berries, leafy greens, and orange/red produce
              </li>
              <li>
                <strong>Omega-3 fatty acids:</strong> Fatty fish, walnuts, flax seeds for cell membrane health
              </li>
              <li>
                <strong>Protein:</strong> Essential for collagen production; include quality sources at each meal
              </li>
              <li>
                <strong>Collagen support:</strong> Foods rich in vitamin C, proline, glycine, copper, and zinc
              </li>
              <li>
                <strong>Limit:</strong> Refined sugars, which accelerate glycation; processed foods high in pro-inflammatory compounds
              </li>
            </ul>
            
            <h3>Sleep: Your Body's Restoration Period</h3>
            <p>
              During deep sleep, your body produces growth hormone and performs cellular repair.
            </p>
            <ul>
              <li>Aim for 7-9 quality hours nightly</li>
              <li>Create a consistent sleep schedule</li>
              <li>Sleep on your back to avoid "sleep wrinkles"</li>
              <li>Use silk or satin pillowcases to reduce friction</li>
              <li>Address sleep disorders—they accelerate aging across all systems</li>
              <li>Keep the bedroom cool (65-68°F/18-20°C) for optimal sleep quality</li>
            </ul>
            
            <h3>Stress Management</h3>
            <p>
              Chronic stress triggers inflammation and accelerates cellular aging through telomere shortening.
            </p>
            <ul>
              <li>Incorporate daily mindfulness practices (meditation, breathwork)</li>
              <li>Regular moderate exercise reduces cortisol levels</li>
              <li>Social connections buffer against stress effects</li>
              <li>Time in nature lowers stress hormones</li>
              <li>Consider adaptogens if approved by your healthcare provider</li>
              <li>Cognitive reframing techniques can change your stress response</li>
            </ul>
            
            <h3>Movement and Exercise</h3>
            <p>
              Regular physical activity impacts aging at the cellular level.
            </p>
            <ul>
              <li>
                <strong>Cardiovascular exercise:</strong> Improves circulation, delivering nutrients to skin cells
              </li>
              <li>
                <strong>Resistance training:</strong> Preserves muscle mass, which declines with age
              </li>
              <li>
                <strong>Flexibility work:</strong> Maintains range of motion and fascia health
              </li>
              <li>
                <strong>Balance training:</strong> Prevents falls, a major threat to healthy aging
              </li>
              <li>Aim for at least 150 minutes of moderate activity weekly, plus 2-3 strength sessions</li>
              <li>Avoid excessive high-intensity exercise, which can increase oxidative stress</li>
            </ul>
            
            <h3>Hydration</h3>
            <p>
              Proper hydration supports all cellular functions and skin appearance.
            </p>
            <ul>
              <li>Minimum 2 liters (8 cups) daily, more with exercise or hot weather</li>
              <li>Herbal teas count toward daily intake and provide antioxidants</li>
              <li>Foods with high water content (cucumbers, watermelon) contribute to hydration</li>
              <li>Limit dehydrating beverages (alcohol, excessive caffeine)</li>
              <li>Hydration needs may increase with age as thirst perception decreases</li>
            </ul>
            
            <h3>Habits to Limit</h3>
            <p>
              Certain behaviors accelerate aging processes dramatically:
            </p>
            <ul>
              <li>
                <strong>Smoking:</strong> Degrades collagen, restricts blood flow, and contains thousands of harmful chemicals
              </li>
              <li>
                <strong>Excessive alcohol:</strong> Dehydrates, interferes with sleep, depletes nutrients
              </li>
              <li>
                <strong>Yo-yo dieting:</strong> Breaks down collagen and elastin, contributing to skin laxity
              </li>
              <li>
                <strong>Extended screen time:</strong> May contribute to skin aging through blue light exposure
              </li>
              <li>
                <strong>Chronic dehydration:</strong> Affects cellular function and visible skin plumpness
              </li>
            </ul>
            
            <h3>Mental Engagement</h3>
            <p>
              Cognitive health is integral to overall aging well.
            </p>
            <ul>
              <li>Learn new skills throughout life</li>
              <li>Maintain social connections and meaningful relationships</li>
              <li>Practice gratitude and positive psychology techniques</li>
              <li>Challenge your brain with puzzles, learning, and novel experiences</li>
              <li>Maintain a sense of purpose and contribution</li>
            </ul>
            
            <p>
              Remember that aging is a natural process, not a disease to be fought. These lifestyle approaches support aging with vitality, resilience, and grace—with visible benefits for your skin and overall health.
            </p>
          </>
        ),
        imagePath: "/img/lifestyle-aging.jpg",
      },
    },
  };

  // Return content for the specific care type and resource type
  return resources[careType]?.[resourceType] || null;
}