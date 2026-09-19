using BikeBooking.Logic;
using BikeBooking.Services.persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BikeBooking.Services
{
    public class BikesService : IBikesService

    {
        private readonly BikesBookingDbContext _context;
        public BikesService(BikesBookingDbContext context)
        {
            _context = context;
        }
        public async Task CreateBike(CreateBikeDto newBikeData)
        {

            if (newBikeData == null)
            {
                throw new ArgumentException();
            }

            var newModel = await _context.FindAsync<Logic.Model>(newBikeData.modelId);
            _context.Bikes.Add(new Logic.Bike() { Model = newModel, Year = newBikeData.year, Price = newBikeData.price });
            await _context.SaveChangesAsync();


        }

        public async Task CreateCategory(CreateCategoryDto newCategoryData)
        {
            var nameCategory = newCategoryData;
            if (nameCategory == null)
            {
                throw new ArgumentException();
            }

            if (await _context.Categories.AnyAsync(cat => cat.Name == nameCategory.name))
            {
                throw new ArgumentException();
            }

            _context.Categories.Add(new Logic.Category() { Name = newCategoryData.name });
            await _context.SaveChangesAsync();
        }

        public async Task CreateModel(CreateModelDto newModelData)
        {

            if (newModelData == null)
            {
                throw new ArgumentException();
            }
            if (await _context.Models.AnyAsync(mod => mod.Name == newModelData.name))
            {
                throw new ArgumentException();
            }

            var newCategory = await _context.FindAsync<Logic.Category>(newModelData.categoryId);

            _context.Models.Add(new Logic.Model() { Name = newModelData.name, Power = newModelData.power, Category = newCategory, StartYear = newModelData.startYear, EndYear = newModelData.endYear });
            await _context.SaveChangesAsync();
        }

        public async Task<BikesDto[]> GetBikes()
        {
            var bikes = await _context.Bikes
           .Include(b => b.Model)
           .ThenInclude(m => m.Category)
           .ToArrayAsync();
            return bikes.Select(bike => new BikesDto(bike.Id, bike.Year, bike.Model.Category.Name, bike.Model.Power, bike.Model.Name, bike.Price)).ToArray();
        }

        public async Task<СategoriesBikesDto[]> GetCategories()
        {
            var categories = await _context.Categories.ToArrayAsync();
            return categories.Select(category => new СategoriesBikesDto(category.Id, category.Name)).ToArray();

        }

        public async Task<ModelsBikesDto[]> GetModels()
        {
            var models = await _context.Models.Include(m => m.Category).ToArrayAsync();
            return models.Select(model => new ModelsBikesDto(model.Id, model.Power, model.StartYear, model.EndYear, model.Name, model.Category.Id, model.Category.Name)).ToArray();

        }
      
    }
}
