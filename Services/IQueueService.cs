using KaraokeBackend.Models;
using System.Collections.Generic;

namespace KaraokeBackend.Services
{
    public interface IQueueService
    {
        IEnumerable<QueueItem> GetPending();
        void Add(QueueItem item);
        void MarkNextPlayed();
    }
}
