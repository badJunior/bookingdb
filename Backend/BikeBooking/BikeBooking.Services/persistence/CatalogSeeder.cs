using BikeBooking.Logic;
using Microsoft.EntityFrameworkCore;

namespace BikeBooking.Services.persistence
{
    /// <summary>
    /// Idempotently fills the catalog with real motorcycle models and photos.
    /// Safe to run on every startup: existing models are reused, and a bike is
    /// added only when that model has no bike in the fleet yet.
    /// </summary>
    public static class CatalogSeeder
    {
        private const string Wm = "https://thumb.wikimedia.org/wikipedia/commons/thumb";

        private static readonly SeedModel[] Seeds =
        [
            // Sport
            new("Honda CBR600RR", "Спорт", 118, 2019, 2023, 1200,
                $"{Wm}/2/2a/2006_Honda_CBR_600RR_Racing_Bike_%2813337367265%29.jpg/1280px-2006_Honda_CBR_600RR_Racing_Bike_%2813337367265%29.jpg"),
            new("Yamaha YZF-R6", "Спорт", 118, 2017, 2022, 1100,
                $"{Wm}/9/96/Peti_bardhal.jpg/1280px-Peti_bardhal.jpg"),
            new("Kawasaki Ninja 400", "Спорт", 45, 2018, 2023, 700,
                $"{Wm}/1/18/HK_SSP_%E9%95%B7%E6%B2%99%E7%81%A3_Cheung_Sha_Wan_%E5%A4%A7%E5%8D%97%E8%A5%BF%E8%A1%97_Tai_Nan_West_Street_motorbike_parking_sidewalk_December_2019_SS2_02.jpg/1280px-HK_SSP_%E9%95%B7%E6%B2%99%E7%81%A3_Cheung_Sha_Wan_%E5%A4%A7%E5%8D%97%E8%A5%BF%E8%A1%97_Tai_Nan_West_Street_motorbike_parking_sidewalk_December_2019_SS2_02.jpg"),
            new("Suzuki GSX-R600", "Спорт", 124, 2011, 2022, 1000,
                $"{Wm}/2/2a/2007TMS_Suzuki_GSX-R_600.jpg/1280px-2007TMS_Suzuki_GSX-R_600.jpg"),
            new("BMW S1000RR", "Спорт", 210, 2019, 2024, 1500,
                $"{Wm}/d/d5/BMW_S_1000_RR_-_BMW_M_1000_RR_50_Years_M_%2822121615413%29.jpg/1280px-BMW_S_1000_RR_-_BMW_M_1000_RR_50_Years_M_%2822121615413%29.jpg"),
            new("Ducati Panigale V4", "Спорт", 215, 2018, 2023, 1600,
                $"{Wm}/a/a8/Ducati_Panigale_V4_-_Tuning_World_Bodensee_2018%2C_Friedrichshafen_%28OW1A0484%29.jpg/1280px-Ducati_Panigale_V4_-_Tuning_World_Bodensee_2018%2C_Friedrichshafen_%28OW1A0484%29.jpg"),
            new("Aprilia RSV4", "Спорт", 217, 2019, 2023, 1500,
                $"{Wm}/b/bb/Moscow%2C_Aprilia_RSV4%2C_June_2025_01.jpg/1280px-Moscow%2C_Aprilia_RSV4%2C_June_2025_01.jpg"),
            new("MV Agusta F3 800", "Спорт", 148, 2018, 2022, 1400,
                $"{Wm}/3/3d/MV_Agusta_F3_red_grey_4.JPG/1280px-MV_Agusta_F3_red_grey_4.JPG"),

            // Naked
            new("Honda CB650R", "Нейкед", 94, 2019, 2024, 900,
                $"{Wm}/f/ff/2023_Honda_CBR650R_E-Clutch.jpg/1280px-2023_Honda_CBR650R_E-Clutch.jpg"),
            new("Yamaha MT-07", "Нейкед", 73, 2021, 2024, 800,
                "https://upload.wikimedia.org/wikipedia/commons/4/45/Yamaha_MT-07_2025_EICMA_2024.jpg"),
            new("Kawasaki Z900", "Нейкед", 125, 2020, 2023, 1000,
                $"{Wm}/b/bc/Kawasaki_Z900%2C_green.jpg/1280px-Kawasaki_Z900%2C_green.jpg"),
            new("Suzuki SV650", "Нейкед", 75, 2016, 2022, 750,
                "https://upload.wikimedia.org/wikipedia/commons/7/77/Suzuki_SV650.jpg"),
            new("KTM 390 Duke", "Нейкед", 44, 2020, 2024, 600,
                $"{Wm}/8/8d/Ktm_duke_390.jpg/1280px-Ktm_duke_390.jpg"),
            new("Triumph Street Triple", "Нейкед", 130, 2020, 2023, 1000,
                $"{Wm}/b/b5/Triumph_Street_Triple_675_front_left_threequarter.jpg/1280px-Triumph_Street_Triple_675_front_left_threequarter.jpg"),
            new("Ducati Monster", "Нейкед", 111, 2021, 2024, 950,
                $"{Wm}/b/b0/2003_Ducati_Monster_S4R.jpg/1280px-2003_Ducati_Monster_S4R.jpg"),

            // Cruiser
            new("Harley-Davidson Sportster", "Круизер", 90, 2020, 2022, 900,
                $"{Wm}/4/4f/Flickr_-_ronsaunders47_-_HARLEY-DAVIDSON_XR1200_SPORTSTER._2010..jpg/1280px-Flickr_-_ronsaunders47_-_HARLEY-DAVIDSON_XR1200_SPORTSTER._2010..jpg"),
            new("Triumph Bonneville T120", "Круизер", 80, 2016, 2023, 850,
                $"{Wm}/3/33/Triumph_Bonneville_IMG_2733.jpg/1280px-Triumph_Bonneville_IMG_2733.jpg"),

            // Adventure
            new("BMW R 1250 GS", "Адвенчер", 136, 2019, 2024, 1100,
                $"{Wm}/1/10/BMW_R1200GS_in_Munich.jpg/1280px-BMW_R1200GS_in_Munich.jpg"),
            new("Ducati Multistrada V4", "Адвенчер", 170, 2021, 2023, 1300,
                $"{Wm}/3/3d/Ducati_Multistrada-red.jpg/1280px-Ducati_Multistrada-red.jpg"),
            new("Honda Africa Twin", "Адвенчер", 102, 2020, 2023, 1000,
                $"{Wm}/6/68/Honda_Africatwin.jpg/1280px-Honda_Africatwin.jpg"),
            new("Yamaha Ténéré 700", "Адвенчер", 72, 2019, 2024, 900,
                $"{Wm}/9/92/Tenere_700.jpg/1280px-Tenere_700.jpg"),
            new("Kawasaki Versys 650", "Адвенчер", 68, 2020, 2023, 800,
                "https://upload.wikimedia.org/wikipedia/commons/1/13/Kawasaki_Versys_650_2025.jpg"),
            new("KTM 1290 Super Adventure", "Адвенчер", 160, 2021, 2022, 1200,
                $"{Wm}/3/35/KTM_1290_Super_Adventure.jpeg/1280px-KTM_1290_Super_Adventure.jpeg"),
            new("Triumph Tiger 900", "Адвенчер", 95, 2020, 2023, 950,
                $"{Wm}/a/a6/Triumph_Tiger_800_XCx.jpeg/1280px-Triumph_Tiger_800_XCx.jpeg"),
            new("Harley-Davidson Pan America", "Адвенчер", 150, 2021, 2024, 1150,
                $"{Wm}/5/50/Hamburg_Harley_Days_2022_06.jpg/1280px-Hamburg_Harley_Days_2022_06.jpg"),
            new("Suzuki V-Strom 650", "Адвенчер", 70, 2017, 2022, 850,
                $"{Wm}/6/66/Red_2005_Suzuki_V-Strom_650.jpg/1280px-Red_2005_Suzuki_V-Strom_650.jpg"),
            new("CFMoto 650MT", "Адвенчер", 61, 2020, 2023, 750,
                $"{Wm}/0/04/CFMoto_450_CLC_2025.jpg/1280px-CFMoto_450_CLC_2025.jpg"),

            // Retro
            new("Royal Enfield Classic 350", "Ретро", 20, 2021, 2023, 550,
                $"{Wm}/8/84/Royal_Enfield_Bullet_500_-_2002_model.jpg/1280px-Royal_Enfield_Bullet_500_-_2002_model.jpg"),
            new("Jawa 42", "Ретро", 27, 2019, 2022, 500,
                "https://upload.wikimedia.org/wikipedia/commons/a/ab/Jawa_350.jpg"),
            new("Ural Gear Up", "Ретро", 41, 2019, 2023, 600,
                $"{Wm}/7/78/Ural_Motorcycles_Feature.jpg/1280px-Ural_Motorcycles_Feature.jpg"),
        ];

        public static async Task SeedAsync(BikesBookingDbContext db, CancellationToken cancellationToken = default)
        {
            var categoryNames = Seeds.Select(seed => seed.Category).Distinct().ToArray();
            var categories = await db.Categories
                .Where(category => categoryNames.Contains(category.Name))
                .ToDictionaryAsync(category => category.Name, cancellationToken);

            foreach (var name in categoryNames)
            {
                if (categories.ContainsKey(name))
                    continue;

                var category = new Category { Name = name };
                db.Categories.Add(category);
                categories[name] = category;
            }

            await db.SaveChangesAsync(cancellationToken);

            var modelNames = Seeds.Select(seed => seed.Name).Distinct().ToArray();
            var models = await db.Models
                .Where(model => modelNames.Contains(model.Name))
                .ToDictionaryAsync(model => model.Name, cancellationToken);

            foreach (var seed in Seeds)
            {
                if (models.ContainsKey(seed.Name))
                    continue;

                var model = new Model
                {
                    Name = seed.Name,
                    Power = seed.Power,
                    StartYear = seed.StartYear,
                    Category = categories[seed.Category]
                };

                db.Models.Add(model);
                models[seed.Name] = model;
            }

            await db.SaveChangesAsync(cancellationToken);

            var seededModelNames = await db.Bikes
                .Select(bike => bike.Model.Name)
                .Distinct()
                .ToListAsync(cancellationToken);
            var modelsWithBikes = seededModelNames.ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var seed in Seeds)
            {
                if (modelsWithBikes.Contains(seed.Name))
                    continue;

                db.Bikes.Add(new Bike
                {
                    Model = models[seed.Name],
                    Year = seed.BikeYear,
                    Price = seed.Price,
                    ImageUrl = seed.ImageUrl
                });
            }

            await db.SaveChangesAsync(cancellationToken);
        }

        private sealed record SeedModel(
            string Name,
            string Category,
            int Power,
            int StartYear,
            int BikeYear,
            int Price,
            string ImageUrl);
    }
}
