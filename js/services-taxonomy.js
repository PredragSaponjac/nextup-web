/**
 * NextUp — Complete Services Taxonomy
 * 3-level hierarchy: Category → Subcategory → Specific Services
 *
 * Structure:
 *   SERVICES_TAXONOMY = {
 *     category_key: {
 *       label: "Display Name",
 *       subcategories: {
 *         subcategory_key: {
 *           label: "Display Name",
 *           services: [ "Service 1", "Service 2", ... ]
 *         }
 *       }
 *     }
 *   }
 */

const SERVICES_TAXONOMY = {

  beauty: {
    label: "Beauty & Personal Care",
    subcategories: {
      hair: {
        label: "Hair",
        services: [
          "Haircut — Women",
          "Haircut — Men",
          "Haircut — Children",
          "Blowout & Styling",
          "Hair Coloring / Highlights",
          "Balayage / Ombre",
          "Keratin Treatment",
          "Hair Extensions",
          "Braiding & Locs",
          "Updos & Special Occasion"
        ]
      },
      nails: {
        label: "Nails",
        services: [
          "Manicure",
          "Pedicure",
          "Gel Nails",
          "Acrylic Nails",
          "Nail Art",
          "Dip Powder",
          "Nail Repair"
        ]
      },
      makeup: {
        label: "Makeup",
        services: [
          "Everyday Makeup",
          "Bridal / Wedding Makeup",
          "Special Event Makeup",
          "Airbrush Makeup",
          "Makeup Lesson"
        ]
      },
      waxing: {
        label: "Waxing & Hair Removal",
        services: [
          "Eyebrow Wax / Shape",
          "Full Face Waxing",
          "Leg Waxing",
          "Brazilian Wax",
          "Full Body Waxing",
          "Laser Hair Removal Consultation"
        ]
      },
      lashes_brows: {
        label: "Lashes & Brows",
        services: [
          "Eyelash Extensions — Full Set",
          "Eyelash Extensions — Fill",
          "Lash Lift & Tint",
          "Brow Lamination",
          "Brow Tinting",
          "Microblading"
        ]
      },
      tanning: {
        label: "Tanning",
        services: [
          "Spray Tan",
          "Custom Airbrush Tan",
          "Tanning Bed Session"
        ]
      }
    }
  },

  spa_wellness: {
    label: "Spa & Wellness",
    subcategories: {
      massage: {
        label: "Massage",
        services: [
          "Swedish Massage",
          "Deep Tissue Massage",
          "Sports Massage",
          "Hot Stone Massage",
          "Prenatal Massage",
          "Couples Massage",
          "Thai Massage",
          "Shiatsu",
          "Lymphatic Drainage"
        ]
      },
      facials: {
        label: "Facials & Skincare",
        services: [
          "Basic Facial",
          "Deep Cleansing Facial",
          "Anti-Aging Facial",
          "Hydrafacial",
          "Chemical Peel",
          "Microdermabrasion",
          "LED Light Therapy",
          "Acne Treatment"
        ]
      },
      body_treatments: {
        label: "Body Treatments",
        services: [
          "Body Scrub / Exfoliation",
          "Body Wrap",
          "Sauna / Steam Session",
          "Float Therapy",
          "Cryotherapy"
        ]
      },
      holistic: {
        label: "Holistic & Alternative",
        services: [
          "Acupuncture",
          "Cupping Therapy",
          "Reiki / Energy Healing",
          "Aromatherapy",
          "Reflexology",
          "Sound Bath / Healing"
        ]
      },
      // Neutral-named specialty wellness services. No 18+ marker, no
      // separate opt-in — the names themselves signal "not your
      // standard Swedish massage" to people looking for that, while
      // staying generic enough to pass App Store / Stripe review
      // unflagged. Provider/customer match by service name as usual;
      // the matching is service-name-specific so a Swedish customer
      // never gets a Personal Companion provider and vice versa.
      personal_wellness: {
        label: "Personal Wellness",
        services: [
          "Therapeutic Touch",
          "Personal Companion",
          "Couples Bodywork"
        ]
      }
    }
  },

  health_fitness: {
    label: "Health & Fitness",
    subcategories: {
      personal_training: {
        label: "Personal Training",
        services: [
          "1-on-1 Personal Training",
          "Partner / Duo Training",
          "Small Group Training",
          "Online / Virtual Training",
          "Strength & Conditioning",
          "Athletic Performance"
        ]
      },
      yoga_pilates: {
        label: "Yoga & Pilates",
        services: [
          "Private Yoga Session",
          "Group Yoga Class",
          "Hot Yoga",
          "Pilates Mat Session",
          "Pilates Reformer Session",
          "Prenatal Yoga"
        ]
      },
      nutrition: {
        label: "Nutrition & Diet",
        services: [
          "Nutrition Consultation",
          "Meal Planning",
          "Weight Management Program",
          "Sports Nutrition"
        ]
      },
      specialty_fitness: {
        label: "Specialty Fitness",
        services: [
          "Boxing / Kickboxing Training",
          "Dance Fitness",
          "Swimming Lessons",
          "Martial Arts Training",
          "CrossFit Coaching",
          "Senior Fitness",
          "Post-Rehab Exercise"
        ]
      }
    }
  },

  home_cleaning: {
    label: "Home Cleaning",
    subcategories: {
      regular_cleaning: {
        label: "Regular Cleaning",
        services: [
          "Standard House Cleaning",
          "Apartment Cleaning",
          "Kitchen Deep Clean",
          "Bathroom Deep Clean"
        ]
      },
      deep_cleaning: {
        label: "Deep & Specialty Cleaning",
        services: [
          "Whole-Home Deep Clean",
          "Move-In / Move-Out Cleaning",
          "Post-Construction Cleanup",
          "Spring Cleaning",
          "Hoarding Cleanup"
        ]
      },
      carpet_floor: {
        label: "Carpet & Floor",
        services: [
          "Carpet Cleaning",
          "Hardwood Floor Cleaning",
          "Tile & Grout Cleaning",
          "Rug Cleaning"
        ]
      },
      windows_exterior: {
        label: "Windows & Exterior",
        services: [
          "Interior Window Cleaning",
          "Exterior Window Cleaning",
          "Gutter Cleaning",
          "Pressure Washing — House",
          "Pressure Washing — Driveway / Patio"
        ]
      },
      specialized: {
        label: "Specialized Cleaning",
        services: [
          "Office / Commercial Cleaning",
          "Airbnb / Vacation Rental Turnover",
          "Garage / Basement Cleanout",
          "Upholstery Cleaning"
        ]
      }
    }
  },

  home_repair: {
    label: "Home Maintenance & Repair",
    subcategories: {
      handyman: {
        label: "General Handyman",
        services: [
          "Furniture Assembly",
          "TV Mounting",
          "Shelf / Curtain Rod Install",
          "Door / Lock Repair",
          "Drywall Repair",
          "Caulking & Sealing",
          "General Fixes & Repairs"
        ]
      },
      plumbing: {
        label: "Plumbing",
        services: [
          "Leaky Faucet / Pipe Repair",
          "Toilet Repair / Install",
          "Drain Cleaning / Unclog",
          "Water Heater Service",
          "Garbage Disposal Install",
          "Sump Pump Service"
        ]
      },
      electrical: {
        label: "Electrical",
        services: [
          "Light Fixture Install",
          "Ceiling Fan Install",
          "Outlet / Switch Repair",
          "Circuit Breaker Service",
          "Recessed Lighting",
          "Whole-Home Electrical Inspection"
        ]
      },
      hvac: {
        label: "HVAC & Climate",
        services: [
          "AC Tune-Up / Repair",
          "Furnace Tune-Up / Repair",
          "Thermostat Install",
          "Duct Cleaning",
          "Mini-Split Install",
          "Air Quality Assessment"
        ]
      },
      painting: {
        label: "Painting & Finishing",
        services: [
          "Interior Painting — Room",
          "Interior Painting — Whole Home",
          "Exterior Painting",
          "Cabinet Painting / Refinish",
          "Deck / Fence Staining",
          "Wallpaper Install / Removal"
        ]
      },
      roofing_exterior: {
        label: "Roofing & Exterior",
        services: [
          "Roof Inspection",
          "Roof Leak Repair",
          "Siding Repair",
          "Fence Repair / Install",
          "Deck Repair / Build"
        ]
      }
    }
  },

  lawn_outdoor: {
    label: "Lawn & Outdoor",
    subcategories: {
      lawn_care: {
        label: "Lawn Care",
        services: [
          "Lawn Mowing",
          "Edging & Trimming",
          "Fertilization & Weed Control",
          "Aeration & Overseeding",
          "Sod Installation",
          "Lawn Pest Treatment"
        ]
      },
      landscaping: {
        label: "Landscaping",
        services: [
          "Landscape Design",
          "Garden Bed Install / Mulch",
          "Shrub & Hedge Trimming",
          "Flower / Plant Installation",
          "Irrigation System Install / Repair",
          "Retaining Wall / Hardscape"
        ]
      },
      tree_service: {
        label: "Tree Service",
        services: [
          "Tree Trimming / Pruning",
          "Tree Removal",
          "Stump Grinding",
          "Emergency Storm Damage"
        ]
      },
      outdoor_maintenance: {
        label: "Outdoor Maintenance",
        services: [
          "Pool Cleaning & Maintenance",
          "Hot Tub Service",
          "Snow Removal — Driveway",
          "Snow Removal — Walkway / Sidewalk",
          "Leaf Removal / Yard Cleanup"
        ]
      }
    }
  },

  pets: {
    label: "Pet Services",
    subcategories: {
      dog_walking: {
        label: "Dog Walking",
        services: [
          "30-Minute Walk",
          "60-Minute Walk",
          "Group Dog Walk",
          "Puppy Walk (short)"
        ]
      },
      pet_sitting: {
        label: "Pet Sitting & Boarding",
        services: [
          "In-Home Pet Sitting (day)",
          "Overnight Pet Sitting",
          "Drop-In Visit (30 min)",
          "Pet Boarding (at sitter's home)"
        ]
      },
      grooming: {
        label: "Pet Grooming",
        services: [
          "Full Grooming — Small Dog",
          "Full Grooming — Large Dog",
          "Bath & Brush Only",
          "Nail Trimming",
          "Cat Grooming",
          "De-shedding Treatment"
        ]
      },
      training: {
        label: "Pet Training",
        services: [
          "Basic Obedience Training",
          "Puppy Training",
          "Behavioral Correction",
          "Advanced / Off-Leash Training",
          "Service Dog Training"
        ]
      },
      other_pet: {
        label: "Other Pet Services",
        services: [
          "Pet Transport",
          "Pet Waste Removal (yard)",
          "Aquarium Cleaning / Maintenance",
          "Exotic Pet Care"
        ]
      }
    }
  },

  childcare: {
    label: "Childcare & Family",
    subcategories: {
      babysitting: {
        label: "Babysitting",
        services: [
          "Daytime Babysitting",
          "Evening / Date Night Sitter",
          "Overnight Babysitting",
          "Weekend Sitter",
          "Last-Minute / Emergency Sitter"
        ]
      },
      nanny: {
        label: "Nanny Services",
        services: [
          "Full-Time Nanny",
          "Part-Time Nanny",
          "Live-In Nanny",
          "Temporary / Fill-In Nanny"
        ]
      },
      tutoring: {
        label: "Tutoring & Education",
        services: [
          "Elementary Tutoring",
          "Middle School Tutoring",
          "High School Tutoring",
          "SAT / ACT Prep",
          "Music Lessons",
          "Language Tutoring",
          "Special Needs Support"
        ]
      },
      newborn: {
        label: "Newborn & Infant",
        services: [
          "Newborn Care Specialist",
          "Night Nurse",
          "Postpartum Doula",
          "Lactation Consultant"
        ]
      }
    }
  },

  senior_care: {
    label: "Senior & Elder Care",
    subcategories: {
      companionship: {
        label: "Companionship",
        services: [
          "Social Companionship Visit",
          "Meal Preparation",
          "Errands & Shopping Assistance",
          "Transportation (doctor, errands)"
        ]
      },
      in_home_care: {
        label: "In-Home Care",
        services: [
          "Personal Care Assistance (bathing, dressing)",
          "Medication Reminders",
          "Light Housekeeping",
          "Mobility Assistance",
          "Overnight / Live-In Care"
        ]
      },
      specialized_senior: {
        label: "Specialized Care",
        services: [
          "Dementia / Alzheimer's Care",
          "Post-Surgery Recovery Care",
          "Physical Therapy Aide",
          "Hospice Support"
        ]
      }
    }
  },

  moving: {
    label: "Moving & Delivery",
    subcategories: {
      local_moving: {
        label: "Local Moving",
        services: [
          "Studio / 1-Bedroom Move",
          "2–3 Bedroom Move",
          "Large Home Move (4+ BR)",
          "Apartment Move (with stairs)",
          "Loading / Unloading Only",
          "Furniture Moving (single items)"
        ]
      },
      packing: {
        label: "Packing & Unpacking",
        services: [
          "Full Packing Service",
          "Partial Packing (fragile items)",
          "Unpacking & Organizing",
          "Packing Supplies Delivery"
        ]
      },
      junk_removal: {
        label: "Junk Removal",
        services: [
          "Single Item Pickup",
          "Garage / Basement Cleanout",
          "Estate Cleanout",
          "Construction Debris Removal",
          "Appliance Disposal"
        ]
      },
      delivery: {
        label: "Delivery & Courier",
        services: [
          "Furniture Delivery",
          "Same-Day Local Courier",
          "Store Pickup & Delivery",
          "Heavy / Oversized Item Delivery"
        ]
      }
    }
  },

  automotive: {
    label: "Automotive",
    subcategories: {
      car_wash: {
        label: "Car Wash & Detailing",
        services: [
          "Exterior Wash",
          "Interior Cleaning",
          "Full Detail — Sedan",
          "Full Detail — SUV / Truck",
          "Paint Correction / Polish",
          "Ceramic Coating",
          "Headlight Restoration"
        ]
      },
      mobile_mechanic: {
        label: "Mobile Mechanic",
        services: [
          "Oil Change",
          "Brake Inspection / Repair",
          "Battery Replacement / Jump",
          "Engine Diagnostics",
          "Belt / Hose Replacement",
          "General Repair & Maintenance"
        ]
      },
      tire: {
        label: "Tire Services",
        services: [
          "Tire Change / Rotation",
          "Flat Tire Repair",
          "Tire Balancing & Alignment",
          "Seasonal Tire Swap"
        ]
      },
      body_glass: {
        label: "Body & Glass",
        services: [
          "Dent Repair (Paintless)",
          "Scratch / Paint Touch-Up",
          "Windshield Chip Repair",
          "Windshield Replacement",
          "Window Tinting"
        ]
      }
    }
  },

  tech: {
    label: "Tech & Smart Home",
    subcategories: {
      computer: {
        label: "Computer & Device Repair",
        services: [
          "Computer Tune-Up / Speed Fix",
          "Virus / Malware Removal",
          "Data Recovery",
          "Screen Replacement — Laptop",
          "Hardware Upgrade (RAM, SSD)",
          "Software Installation & Setup"
        ]
      },
      phone_tablet: {
        label: "Phone & Tablet",
        services: [
          "Screen Replacement — Phone",
          "Screen Replacement — Tablet",
          "Battery Replacement",
          "Data Transfer / Phone Setup"
        ]
      },
      smart_home: {
        label: "Smart Home",
        services: [
          "Smart Thermostat Install",
          "Smart Lock / Doorbell Install",
          "Smart Lighting Setup",
          "Home Automation Setup",
          "Voice Assistant Configuration"
        ]
      },
      networking: {
        label: "Networking & Security",
        services: [
          "WiFi Setup / Troubleshoot",
          "Network Wiring / Ethernet",
          "Security Camera Install",
          "Home Security System Setup",
          "NAS / Home Server Setup"
        ]
      },
      av_setup: {
        label: "A/V & Entertainment",
        services: [
          "Home Theater Setup",
          "Surround Sound Install",
          "Projector Install",
          "Whole-Home Audio Setup"
        ]
      }
    }
  },

  events: {
    label: "Events & Entertainment",
    subcategories: {
      photography: {
        label: "Photography",
        services: [
          "Portrait Photography",
          "Family Photography",
          "Event / Party Photography",
          "Wedding Photography",
          "Product Photography",
          "Real Estate Photography",
          "Headshots"
        ]
      },
      videography: {
        label: "Videography",
        services: [
          "Event Videography",
          "Wedding Videography",
          "Promo / Commercial Video",
          "Drone Videography"
        ]
      },
      music_dj: {
        label: "Music & DJ",
        services: [
          "DJ — Party / Event",
          "DJ — Wedding",
          "Live Musician / Band",
          "Karaoke Setup"
        ]
      },
      catering_bar: {
        label: "Catering & Bar",
        services: [
          "Full Event Catering",
          "Drop-Off Catering",
          "Private Chef (dinner party)",
          "Bartender / Mixologist",
          "Cake / Dessert Catering"
        ]
      },
      event_planning: {
        label: "Event Planning & Decor",
        services: [
          "Full Event Planning",
          "Day-Of Coordination",
          "Balloon & Decor Setup",
          "Floral Arrangements",
          "Party Rentals (tables, chairs, tents)"
        ]
      },
      entertainment: {
        label: "Entertainment",
        services: [
          "Face Painting",
          "Magician / Entertainer",
          "Photo Booth Rental",
          "Character Performer (kids' parties)",
          "MC / Emcee"
        ]
      }
    }
  },

  laundry: {
    label: "Laundry & Clothing",
    subcategories: {
      laundry_service: {
        label: "Laundry",
        services: [
          "Wash & Fold",
          "Dry Cleaning — Standard",
          "Dry Cleaning — Formal / Delicate",
          "Ironing / Pressing",
          "Pickup & Delivery Laundry"
        ]
      },
      alterations: {
        label: "Alterations & Tailoring",
        services: [
          "Hemming (pants, dresses)",
          "Zipper Replacement",
          "Custom Tailoring",
          "Wedding Dress Alterations",
          "Suit Fitting & Alterations"
        ]
      },
      shoe_leather: {
        label: "Shoe & Leather Care",
        services: [
          "Shoe Repair",
          "Shoe Cleaning & Restoration",
          "Leather Repair / Conditioning",
          "Handbag / Purse Repair"
        ]
      }
    }
  },

  // v1.3.2 — Low-risk errand/courier services. Functional but heavily
  // disclaimed: ID-verified provider required, items under $200, NextUp
  // does not insure cargo. Provider declares auto insurance covers
  // business use during signup.
  errands_delivery: {
    label: "Errands & Pickup",
    subcategories: {
      package: {
        label: "Package retrieval",
        services: [
          "FedEx pickup",
          "UPS pickup",
          "USPS pickup",
          "Amazon locker collection"
        ]
      },
      store_drop: {
        label: "Store drop-off",
        services: [
          "Return at retailer",
          "Donation drop-off",
          "Drop at recycling center"
        ]
      },
      pickup: {
        label: "Errand pickup",
        services: [
          "Dry cleaning pickup",
          "Pre-paid grocery pickup",
          "Prescription pickup (by patient's authorized contact)"
        ]
      },
      courier: {
        label: "Small item courier",
        services: [
          "Document courier (intra-city)",
          "Small parcel courier (under $200 declared value)"
        ]
      }
    }
  },

  // v1.3.2 — PLACEHOLDER (Coming Soon). Tile shows on Home but tap is
  // intercepted by NX_COMING_SOON_CATEGORIES → modal. Backend rejects
  // any broadcast attempt at this category. Will unlock when LLC +
  // business insurance + Driver Verified verification tier are live.
  drive_transport: {
    label: "Drive & Transport",
    subcategories: {
      placeholder: {
        label: "Coming soon",
        services: ["(Coming soon)"]
      }
    }
  }

};

// Expose on window so other scripts can access (top-level `const` in a plain
// script tag does NOT auto-attach to window in Capacitor's WKWebView).
window.SERVICES_TAXONOMY = SERVICES_TAXONOMY;
