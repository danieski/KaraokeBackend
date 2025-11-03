namespace KaraokeBackend.Models
{

    public class QueueItem
    {
        public int Id { get; set; }
        public string VideoId { get; set; }
        public string Title { get; set; }
        public string User { get; set; }
        public string Status { get; set; } = "pending";
    }

}
