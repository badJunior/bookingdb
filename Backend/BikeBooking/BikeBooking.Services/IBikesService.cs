using BikeBooking.Logic;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BikeBooking.Services
{
    public interface IBikesService

    {

        Task<СategoriesBikesDto[]> GetCategories();
        Task CreateCategory(CreateCategoryDto newCategoryData);
        Task<ModelsBikesDto[]> GetModels();
        Task CreateModel(CreateModelDto newModelData);
        Task CreateBike(CreateBikeDto newBikeData);
    }

    public record СategoriesBikesDto(int id, string name);
    public record CreateCategoryDto(string name);

    public record ModelsBikesDto(int id,int power,int startYear, int? endYear,string name, int categoryId, string categoryName);
    public record CreateModelDto( int power, int startYear, int? endYear, string name, int categoryId);
    public record CreateBikeDto( int modelId,int year);
  
}
